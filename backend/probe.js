import ffmpegStatic from 'ffmpeg-static';
import { execSync } from 'child_process';
try {
  execSync(`"${ffmpegStatic}" -i "d:/AI-INTERVIEW-COACH/backend/uploads/recordings/recording-1790792753360-868234253.webm"`, { encoding: 'utf8', stdio: 'pipe' });
} catch (e) {
  console.log(e.stderr);
}
