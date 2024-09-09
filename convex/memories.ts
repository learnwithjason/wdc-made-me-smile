import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const getByUser = query({
	handler: async (ctx) => {
		const S3 = new S3Client({
			region: 'auto',
			endpoint: 'https://fly.storage.tigris.dev',
			credentials: {
				accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
				secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
			},
		});

		const identity = await ctx.auth.getUserIdentity();
		const memories = await ctx.db
			.query('memories')
			.filter((q) =>
				q.and(
					q.eq(q.field('user'), identity?.subject),
					q.eq(q.field('ready'), true),
				),
			)
			.collect();

		return await Promise.all(
			memories.map(async (data) => {
				const imageUrl = await getSignedUrl(
					S3,
					new GetObjectCommand({
						Bucket: 'wdc-made-me-smile',
						Key: data.imageKey,
					}),
					{ expiresIn: 3600 },
				);

				return {
					...data,
					imageUrl,
				};
			}),
		);
	},
});

export const set = mutation({
	args: {
		memory: v.string(),
		imageData: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();

		if (!identity) {
			return;
		}

		const memory = args.memory;
		const date = Date.now();
		const imageKey = `${identity.subject}-${date}.jpg`;

		const id = await ctx.db.insert('memories', {
			date,
			memory,
			imageKey,
			ready: false,
			user: identity.subject,
		});

		await ctx.scheduler.runAfter(0, internal.upload.uploadImage, {
			imageKey,
			imageBase64Data: args.imageData,
			id,
		});
	},
});

export const setReady = internalMutation({
	args: { id: v.id('memories') },
	handler: async (ctx, { id }) => {
		await ctx.db.patch(id, {
			ready: true,
		});
	},
});
