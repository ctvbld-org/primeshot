import Archiver from 'archiver';
import { Readable as NodeReadable } from 'stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
export async function createZipStreamFromS3(s3, bucket, keys, limits) {
    const archive = Archiver('zip', { zlib: { level: 9 } });
    archive.on('warning', (e) => archive.emit('error', e));
    let totalBytes = 0;
    let fileCount = 0;
    async function streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }
    ;
    (async () => {
        var _a;
        for (const key of keys) {
            if ((limits === null || limits === void 0 ? void 0 : limits.maxFiles) != null && fileCount >= limits.maxFiles) {
                throw new Error(`zip maxFiles exceeded: ${limits.maxFiles}`);
            }
            const resp = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
            // Normalize AWS SDK v3 Body to a Buffer for consistent typing across runtimes
            const anyBody = resp.Body;
            let buffer;
            if (typeof (anyBody === null || anyBody === void 0 ? void 0 : anyBody.transformToByteArray) === 'function') {
                const bytes = await anyBody.transformToByteArray();
                buffer = Buffer.from(bytes);
            }
            else if (anyBody === null || anyBody === void 0 ? void 0 : anyBody.pipe) {
                buffer = await streamToBuffer(anyBody);
            }
            else if (anyBody === null || anyBody === void 0 ? void 0 : anyBody.transformToWebStream) {
                const nodeStream = NodeReadable.fromWeb(anyBody.transformToWebStream());
                buffer = await streamToBuffer(nodeStream);
            }
            if (!buffer)
                throw new Error(`Missing S3 Body for key: ${key}`);
            const contentLen = Number((_a = resp.ContentLength) !== null && _a !== void 0 ? _a : 0);
            if ((limits === null || limits === void 0 ? void 0 : limits.maxBytes) != null) {
                // pre-check using ContentLength if present
                if (totalBytes + contentLen > limits.maxBytes) {
                    throw new Error(`zip maxBytes exceeded: ${limits.maxBytes}`);
                }
                totalBytes += contentLen;
            }
            const name = key.split('/').pop() || 'file';
            archive.append(buffer, { name });
            fileCount += 1;
        }
        archive.finalize();
    })().catch((e) => archive.emit('error', e));
    return archive;
}
