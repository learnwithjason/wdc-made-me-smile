'use node';

import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { Buffer } from 'node:buffer';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { internal } from './_generated/api';

export const uploadImage = internalAction({
	args: {
		imageKey: v.string(),
		imageBase64Data: v.string(),
		id: v.id('memories'),
	},
	handler: async (ctx, { imageKey, imageBase64Data, id }) => {
		const S3 = new S3Client({
			region: 'auto',
			endpoint: 'https://fly.storage.tigris.dev',
			credentials: {
				accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
				secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
			},
		});

		const base64Data = imageBase64Data.split(',').at(1)!;
		const buf = Buffer.from(base64Data, 'base64');

		const upload = new Upload({
			params: {
				Bucket: 'wdc-made-me-smile',
				Key: imageKey,
				Body: buf,
				ContentType: 'image/jpeg',
			},
			client: S3,
			queueSize: 3,
		});

		upload.on('httpUploadProgress', (progress) => {
			console.log(progress);
		});

		await upload.done();

		await ctx.runMutation(internal.memories.setReady, { id });
	},
});
