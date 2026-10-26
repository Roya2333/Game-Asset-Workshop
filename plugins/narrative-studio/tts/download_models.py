"""Resumable model download using Windows curl, with upstream size/SHA256 checks."""
import argparse
import hashlib
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
from pathlib import Path
import subprocess
from urllib.parse import quote

parser = argparse.ArgumentParser()
parser.add_argument('repo')
parser.add_argument('destination', type=Path)
parser.add_argument('--include', nargs='*')
args = parser.parse_args()
args.destination.mkdir(parents=True, exist_ok=True)
base = 'https://hf-mirror.com'
metadata = args.destination / '.download-tree.json'
subprocess.run(['curl.exe', '-fLsS', '--retry', '5', '--connect-timeout', '20',
                '--max-time', '120', f'{base}/api/models/{args.repo}/tree/main?recursive=true',
                '-o', str(metadata)], check=True)
entries = json.loads(metadata.read_text(encoding='utf-8'))
for entry in entries:
    if entry['type'] != 'file' or (args.include and entry['path'] not in args.include):
        continue
    target = (args.destination / entry['path']).resolve()
    if not target.is_relative_to(args.destination.resolve()):
        raise ValueError('Invalid model path')
    target.parent.mkdir(parents=True, exist_ok=True)
    size = entry['size']
    def verified():
        if not target.exists() or target.stat().st_size != size:
            return False
        sha = entry.get('lfs', {}).get('oid')
        if sha:
            with target.open('rb') as stream:
                return hashlib.file_digest(stream, 'sha256').hexdigest() == sha
        return True
    if verified():
        print(f'Verified {entry["path"]}', flush=True)
        continue
    part = target.with_name(target.name + '.partial')
    print(f'Downloading {entry["path"]}: {size / 1024**2:.1f} MiB', flush=True)
    url = (f'https://modelscope.cn/models/{args.repo}/resolve/master/{quote(entry["path"])}'
           if args.repo == 'IndexTeam/IndexTTS-2.5' else f'{base}/{args.repo}/resolve/main/{quote(entry["path"])}')
    if size > 64 * 1024**2:
        chunk = 16 * 1024**2
        pieces = target.with_name(target.name + '.parts')
        pieces.mkdir(exist_ok=True)
        # Import complete ranges from an earlier sequential download.
        if part.exists():
            with part.open('rb') as old:
                for index in range(part.stat().st_size // chunk):
                    piece = pieces / f'{index:05}.part'
                    if not piece.exists():
                        piece.write_bytes(old.read(chunk))
                    else:
                        old.seek(chunk, 1)
        def get_range(index):
            begin, end = index * chunk, min(size, (index + 1) * chunk) - 1
            piece = pieces / f'{index:05}.part'
            expected = end - begin + 1
            if piece.exists() and piece.stat().st_size == expected:
                return
            tail = piece.with_suffix('.download')
            subprocess.run(['curl.exe', '-fsSL', '--retry', '5', '--retry-all-errors',
                '--connect-timeout', '20', '--max-time', '300', '--max-filesize', str(expected),
                '--range', f'{begin}-{end}', url, '-o', str(tail)], check=True)
            if tail.stat().st_size != expected:
                raise ValueError(f'Invalid model range: {index}')
            tail.replace(piece)
        count = (size + chunk - 1) // chunk
        with ThreadPoolExecutor(max_workers=8) as pool:
            futures = [pool.submit(get_range, index) for index in range(count)]
            for completed, future in enumerate(as_completed(futures), 1):
                future.result()
                print(f'{entry["path"]}: {completed}/{count} ranges', flush=True)
        with part.open('wb') as output:
            for index in range(count):
                with (pieces / f'{index:05}.part').open('rb') as piece:
                    shutil.copyfileobj(piece, output)
    else:
        subprocess.run(['curl.exe', '-fsSL', '--retry', '8', '--retry-all-errors',
                        '--connect-timeout', '20', '--max-time', '300', '-C', '-', url,
                        '-o', str(part)], check=True)
    part.replace(target)
    if not verified():
        raise ValueError(f'Model verification failed: {entry["path"]}')
    if size > 64 * 1024**2:
        shutil.rmtree(pieces)
print('All requested model files verified.', flush=True)
