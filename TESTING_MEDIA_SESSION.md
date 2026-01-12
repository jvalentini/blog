# Testing Media Session API

## Quick Test Checklist

### 1. **Verify Media Session API is Available**
Open browser console and run:
```javascript
console.log('Media Session supported:', 'mediaSession' in navigator);
console.log('Current metadata:', navigator.mediaSession?.metadata);
```

### 2. **Test on Mobile Device (Best Results)**
- **Android Chrome**: Full support with notification controls
- **iOS Safari**: Full support with lock screen controls

**Steps:**
1. Open preview URL on mobile device
2. Navigate to `/waves` page
3. Click play on a track
4. Pull down notification shade (Android) or lock device (iOS)
5. You should see:
   - Track title with genre: "Song Title (Hip-Hop Version)"
   - Artist: "jvalentini"
   - Album: "waves"
   - Play/Pause button
   - Next/Previous buttons
   - Progress bar (on Android)

### 3. **Test on Desktop (Limited Support)**
- **Chrome/Edge**: Shows metadata in browser, but no notification controls
- **Firefox**: Limited support
- **Safari**: Limited support

**Steps:**
1. Open preview URL
2. Navigate to `/waves` page
3. Open DevTools → Application → Media Session (if available)
4. Click play on a track
5. Check if metadata appears

### 4. **Test Action Handlers**
1. Start playing a track
2. Use notification/lock screen controls:
   - **Play/Pause**: Should toggle playback
   - **Next**: Should advance to next track
   - **Previous**: Should go to previous (or restart if < 3s)
   - **Seek** (if available): Should skip 10 seconds

### 5. **Test Metadata Updates**
1. Start playing a track
2. Switch genres (press G or click genre button)
3. Check notification - title should update with new genre
4. Switch to next track
5. Check notification - should show new track with genre

### 6. **Test Action Availability**
1. Play first track in queue
2. Check notification - Previous button should be disabled (if repeat is off)
3. Play last track in queue
4. Check notification - Next button should be disabled (if repeat is off)
5. Enable repeat mode
6. Check notification - Both buttons should be enabled

## Troubleshooting

### Issue: Media Session not working at all

**Check:**
1. **HTTPS Required**: Media Session API requires HTTPS (or localhost)
   - Preview URLs should be HTTPS, but verify
   - Check browser console for errors

2. **Browser Support**: 
   ```javascript
   if (!('mediaSession' in navigator)) {
     console.error('Media Session API not supported');
   }
   ```

3. **Console Errors**: Check browser console for:
   - "Media Session API not supported" warning
   - Any errors from MediaSessionManager

### Issue: Controls don't appear in notification

**Possible Causes:**
1. **Audio not playing**: Media Session only shows when audio is actually playing
   - Verify audio is playing (check audio element state)
   - Check for autoplay policy blocking playback

2. **Metadata not set**: 
   ```javascript
   console.log('Metadata:', navigator.mediaSession?.metadata);
   ```
   Should show title, artist, album

3. **Action handlers not registered**:
   ```javascript
   // Try manually setting a handler to test
   navigator.mediaSession.setActionHandler('play', () => {
     console.log('Play action triggered');
   });
   ```

### Issue: Controls appear but don't work

**Check:**
1. **Action handlers registered**: Check console for errors when clicking controls
2. **Audio element state**: Verify audio element exists and is accessible
3. **Queue state**: Check if queue manager is in valid state

### Issue: Metadata shows wrong track

**Check:**
1. **Race condition**: Rapid track changes might cause this
2. **Track ID**: Verify track IDs are unique
3. **Console logs**: Check for "MediaSessionManager" logs

## Debug Mode

Add this to browser console to enable verbose logging:

```javascript
// Enable debug logging
localStorage.setItem('mediaSessionDebug', 'true');
// Reload page
```

Or add this temporarily to `media-session-manager.ts`:

```typescript
private debug: boolean = true;

// In each method:
if (this.debug) {
  console.log('[MediaSessionManager] updateMetadata', metadata);
}
```

## Testing Checklist

- [ ] Media Session API is available (`'mediaSession' in navigator`)
- [ ] Metadata appears when track starts playing
- [ ] Metadata shows correct title with genre
- [ ] Play/Pause button works in notification
- [ ] Next button works in notification
- [ ] Previous button works in notification
- [ ] Seek buttons work (if available)
- [ ] Metadata updates when genre changes
- [ ] Metadata updates when track changes
- [ ] Action availability is correct (next/previous disabled at boundaries)
- [ ] Position state shows progress (Android)
- [ ] Controls work when tab is in background
- [ ] No console errors

## Common Issues on Preview URLs

1. **CORS**: Audio files might be blocked if not served from same origin
2. **HTTPS**: Some preview URLs might not be HTTPS
3. **Service Worker**: If site uses service worker, might interfere
4. **Cache**: Old cached version might not have Media Session code

## Manual Testing Commands

Open browser console on `/waves` page and run:

```javascript
// Check if Media Session is initialized
console.log('Media Session:', navigator.mediaSession);
console.log('Metadata:', navigator.mediaSession?.metadata);

// Check if player is initialized
console.log('Player API:', window.musicPlayerAPI);
console.log('Player State:', window.musicPlayerAPI?.getState());

// Manually test action handler
navigator.mediaSession.setActionHandler('play', () => {
  console.log('Manual play handler triggered');
  window.musicPlayerAPI?.playAudio();
});

// Check position state
// (Position state is internal, but you can verify audio is playing)
const audio = document.getElementById('audio-player');
console.log('Audio playing:', !audio.paused);
console.log('Audio currentTime:', audio.currentTime);
console.log('Audio duration:', audio.duration);
```
