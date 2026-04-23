# Sound Effects Download Guide

## Required Sound Files

Download and place these files in `assets/sounds/`:

### 1. **milestone.mp3** - Achievement/Milestone Unlocked

**Where to download:**

- **Freesound.org**: Search "achievement bell" or "success fanfare"
  - https://freesound.org/search/?q=achievement+bell
  - Recommended: Short (1-2s), triumphant sound
- **Zapsplat.com**: Search "game achievement"
  - https://www.zapsplat.com/sound-effect-category/game-sounds/
- **Mixkit.co**: Game UI category
  - https://mixkit.co/free-sound-effects/game/

**Characteristics:**

- Duration: 1-2 seconds
- Triumphant/celebratory tone
- Not too loud or jarring

---

### 2. **exercise-done.mp3** - Exercise Completion

**Where to download:**

- **Freesound.org**: Search "ui success" or "notification ding"
  - https://freesound.org/search/?q=ui+success
- **Mixkit.co**: UI sounds
  - https://mixkit.co/free-sound-effects/notification/

**Characteristics:**

- Duration: 0.3-0.8 seconds
- Light, pleasant "pop" or "ding"
- Lighter than XP gain sound

---

### 3. **countdown.mp3** - Countdown Timer Tick

**Where to download:**

- **Freesound.org**: Search "beep short" or "ui tick"
  - https://freesound.org/search/?q=beep+short
- **Zapsplat.com**: Search "timer beep"

**Characteristics:**

- Duration: 0.2-0.5 seconds
- Simple beep or tick
- Clear but not harsh

---

### 4. **streak.mp3** - Streak Milestone (5, 10, 30 days)

**Where to download:**

- **Freesound.org**: Search "chime" or "notification"
  - https://freesound.org/search/?q=chime
- **Pixabay**: Search "notification chime"
  - https://pixabay.com/sound-effects/search/chime/

**Characteristics:**

- Duration: 0.8-1.5 seconds
- Motivational, positive tone
- Chime or bell-like

---

## Download Instructions

1. **Visit the recommended sites:**
   - Freesound.org (create free account)
   - Zapsplat.com (free with account)
   - Mixkit.co (no account needed)
   - Pixabay.com (no account needed)

2. **Search for the sound type** listed above

3. **Filter/Sort:**
   - Duration: Short (< 2 seconds)
   - Format: MP3 or WAV
   - License: Creative Commons or royalty-free

4. **Download and rename:**
   - Save as exact filename (milestone.mp3, exercise-done.mp3, etc.)
   - Convert WAV to MP3 if needed (use online converter)

5. **Place in project:**
   ```bash
   cp downloaded-sound.mp3 assets/sounds/milestone.mp3
   ```

## Alternative: Use Existing Sounds Temporarily

If you want to test the app immediately, you can duplicate existing sounds:

```bash
cd assets/sounds
cp xp-gain.mp3 milestone.mp3
cp xp-gain.mp3 exercise-done.mp3
cp xp-gain.mp3 countdown.mp3
cp level-up.mp3 streak.mp3
```

Then replace them with proper sounds later.

## Tips

- **Volume normalize** all sounds to similar loudness
- Test on both **mobile and web**
- Keep sounds **under 1 second** (except level-up and milestone)
- Consider a **consistent theme** (all electronic/all organic/all 8-bit)
- **MP3 format** preferred (smaller than WAV)

## Current Sounds (Already in Project)

✅ `xp-gain.mp3` - XP earned sound
✅ `level-up.mp3` - Level up fanfare

## Sound Toggle

Users can now toggle sounds on/off in the sidebar:

- Settings → Sound → On/Off toggle
- Preference is saved in AsyncStorage
