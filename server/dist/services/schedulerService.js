import cron from "node-cron";
import mongoose from "mongoose";
import { publishDuePosts } from "./publishService.js";
let schedulerStarted = false;
export const initScheduler = () => {
    if (schedulerStarted)
        return;
    schedulerStarted = true;
    cron.schedule("* * * * *", async () => {
        try {
            if (mongoose.connection.readyState !== 1) {
                return;
            }
            const now = new Date();
            const summary = await publishDuePosts(now);
            if (summary.evaluated > 0) {
                console.log(`Evaluated ${summary.evaluated} scheduled posts at ${now.toISOString()}`);
            }
        }
        catch (error) {
            console.error("Error in scheduler:", error);
        }
    });
    console.log("Scheduler service initialized");
};
