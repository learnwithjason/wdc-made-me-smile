import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	memories: defineTable({
		memory: v.string(),
		imageKey: v.string(),
		user: v.string(),
		date: v.number(),
		ready: v.boolean(),
	}),
});
