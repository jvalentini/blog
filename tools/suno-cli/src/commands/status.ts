import { Command } from 'commander';
import { sunoAPI } from '../api.js';

export function createStatusCommand(): Command {
  const command = new Command('status');

  command
    .description('Check the status of a generation task')
    .argument('<taskId>', 'Task ID to check')
    .option('-w, --watch', 'Watch for completion')
    .option('-i, --interval <seconds>', 'Watch interval in seconds', parseInt, 5)
    .action(async (taskId, options) => {
      try {
        if (options.watch) {
          await watchStatus(taskId, options.interval);
        } else {
          await checkStatus(taskId);
        }
      } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return command;
}

async function checkStatus(taskId: string): Promise<void> {
  console.log(`🔍 Checking status for task: ${taskId}`);

  const status = await sunoAPI.getTaskStatus(taskId);

  console.log(`Status: ${status.msg} (${status.code})`);

  if (status.data) {
    console.log(`Callback Type: ${status.data.callbackType}`);
    console.log(`Task ID: ${status.data.task_id}`);

    if (status.data.data && status.data.data.length > 0) {
      console.log('\n🎶 Tracks:');
      status.data.data.forEach((track, index) => {
        console.log(`\nTrack ${index + 1}:`);
        console.log(`  ID: ${track.id}`);
        console.log(`  Title: ${track.title}`);
        console.log(`  Audio URL: ${track.audio_url}`);
        console.log(`  Stream URL: ${track.stream_audio_url}`);
        console.log(`  Duration: ${track.duration}s`);
        console.log(`  Tags: ${track.tags}`);
        console.log(`  Created: ${track.createTime}`);
        console.log(`  Model: ${track.model_name}`);
      });
    }
  }
}

async function watchStatus(taskId: string, intervalSeconds: number): Promise<void> {
  console.log(`👀 Watching task: ${taskId} (checking every ${intervalSeconds}s)`);
  console.log('Press Ctrl+C to stop watching\n');

  const intervalMs = intervalSeconds * 1000;

  while (true) {
    try {
      const status = await sunoAPI.getTaskStatus(taskId);

      console.log(`${new Date().toISOString()} - Status: ${status.msg} (${status.code})`);

      if (status.data?.callbackType === 'complete') {
        console.log('✅ Task completed!');

        if (status.data.data && status.data.data.length > 0) {
          console.log('\n🎶 Final tracks:');
          status.data.data.forEach((track, index) => {
            console.log(`\nTrack ${index + 1}:`);
            console.log(`  ID: ${track.id}`);
            console.log(`  Title: ${track.title}`);
            console.log(`  Audio URL: ${track.audio_url}`);
            console.log(`  Stream URL: ${track.stream_audio_url}`);
            console.log(`  Duration: ${track.duration}s`);
            console.log(`  Tags: ${track.tags}`);
          });
        }
        break;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));

    } catch (error) {
      console.log(`${new Date().toISOString()} - ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
}
