"""Run in the official IndexTTS2 environment, from its repository directory.
python indextts2_bridge.py --model-dir checkpoints-2.5
"""
import argparse
import base64
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

EMOTIONS = ['正常','开心','生气','悲伤','恐惧','惊讶','厌恶','疑惑','害羞','傲慢','疲惫','兴奋','无奈','内疚','疯狂']
ALLOWED_ORIGINS = {'narrative-studio://plugin'}
lock = threading.Lock()

class Handler(BaseHTTPRequestHandler):
    def origin_allowed(self):
        return self.headers.get('Origin') in ALLOWED_ORIGINS

    def reply(self, status, data, mime='application/json'):
        self.send_response(status)
        if self.origin_allowed():
            self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        if not self.origin_allowed():
            return self.reply(403, b'{}')
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', self.headers['Origin'])
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        if self.path != '/health':
            return self.reply(404, b'{}')
        self.reply(200, json.dumps({'model':'IndexTTS2.5','ready':True,'projectId':args.project_id,'bridgeVersion':'0.5.0','parameters':['duration_factor','emo_alpha']}).encode())

    def do_POST(self):
        if not self.origin_allowed():
            return self.reply(403, b'{}')
        if self.path != '/synthesize':
            return self.reply(404, b'{}')
        acquired = False
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 29 * 1024 * 1024:
                raise ValueError('请求大小不正确')
            data = json.loads(self.rfile.read(size))
            text = data.get('text', '').strip()
            emotion = data.get('emotion', '正常')
            if not text or len(text) > 5000 or emotion not in EMOTIONS:
                raise ValueError('请检查台词长度（1 至 5000 字）和情绪')
            header, encoded = data['reference'].split(',', 1)
            if not header.startswith('data:audio/') or ';base64' not in header:
                raise ValueError('参考声音必须是音频')
            audio = base64.b64decode(encoded, validate=True)
            if not 0 < len(audio) <= 20 * 1024 * 1024:
                raise ValueError('参考音频大小不正确')
            acquired = lock.acquire(blocking=False)
            if not acquired:
                return self.reply(409, json.dumps({'error':'模型正在生成，请稍后重试'}, ensure_ascii=False).encode())
            with tempfile.TemporaryDirectory(prefix='character-tts-') as folder:
                suffix = Path(data.get('referenceName', 'reference.wav')).suffix.lower()
                if suffix not in {'.wav','.mp3','.ogg','.flac','.m4a','.webm'}:
                    suffix = '.wav'
                source = Path(folder) / ('reference' + suffix)
                output = Path(folder) / 'output.wav'
                source.write_bytes(audio)
                duration_factor = float(data.get('duration_factor', 1))
                emo_alpha = float(data.get('emo_alpha', .7))
                if not .5 <= duration_factor <= 2 or not 0 <= emo_alpha <= 1:
                    raise ValueError('语速或情绪强度超出范围')
                kwargs = {'duration_factor':duration_factor}
                if emotion != '正常':
                    kwargs.update(use_emo_text=True, emo_text=emotion, emo_alpha=emo_alpha)
                tts.infer(spk_audio_prompt=str(source), text=text, lang="ZH", output_path=str(output), use_random=False, **kwargs)
                self.reply(200, output.read_bytes(), 'audio/wav')
        except Exception as exc:
            self.reply(400, json.dumps({'error':str(exc)}, ensure_ascii=False).encode())
        finally:
            if acquired:
                lock.release()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--model-dir', default='checkpoints')
    parser.add_argument('--repo', default=os.getcwd())
    parser.add_argument('--port', type=int, default=9880)
    parser.add_argument('--fp16', action='store_true')
    parser.add_argument('--project-id', default='')
    args = parser.parse_args()
    sys.path.insert(0, str(Path(args.repo).absolute()))
    from indextts.infer_v2_5 import IndexTTS2
    model = str(Path(args.model_dir).absolute())
    import torch
    tts = IndexTTS2(model_dir=model, cfg_path=str(Path(model) / 'config.yaml'), use_bf16=torch.cuda.is_available(), use_cuda_kernel=False, use_deepspeed=False, use_qwen_emo=True)
    print(f'IndexTTS2.5 ready: http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
