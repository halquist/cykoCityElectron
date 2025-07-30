class SoundtrackManager {
    constructor(scene) {
        this.scene = scene;
        this.songs = {}; // Holds the sounds categorized by type (e.g., battle, title, faction)
        this.currentCategory = null; // Current category of songs being played
        this.currentSongIndex = 0; // Current song index
        this.isLooping = false; // Whether songs should loop
        this.isPlaying = false; // Is music currently playing
    }

    // Loader function: accepts a config object with categorized song names
    loader(config) {
        for (let category in config) {
            config[category].forEach(song => {
                this.scene.load.audio(song, `assets/music/${song}.mp3`); // Adjust path as necessary
            });
        }
    }

    // Creator function: accepts the same config object and creates sound instances
    create(config) {
        for (let category in config) {
            this.songs[category] = [];
            config[category].forEach(song => {
                const sound = this.scene.sound.add(song);
                this.songs[category].push(sound);
            });
        }
    }

    // Play function: accepts an argument object to specify song/category, volume, and loop behavior
    play({ category = null, song = null, volume = 1, loop = false, shuffle = false } = {}) {
        if (song) {
            this.stop();
            const sound = this.scene.sound.get(song);
            if (sound) {
                sound.setVolume(volume);
                sound.setLoop(loop);
                sound.play();
                this.isPlaying = true;
            }
        } else if (category && this.songs[category]) {
            this.currentCategory = category;
            this.currentSongIndex = 0;
            this.isLooping = loop;
    
            if (shuffle) {
                this.shuffleArray(this.songs[this.currentCategory]);
            }
    
            this.playNextInCategory(volume);
        } else {
            const allSongs = Object.values(this.songs).flat();
        
            if (shuffle) {
                this.shuffledSongs = [...allSongs]; // save for playback
                this.shuffleArray(this.shuffledSongs);
                this.currentSongIndex = 0;
                this.isLooping = true;
                this.playNextFromShuffled(volume);
            } else {
                // Default: play first category as fallback
                const allCategories = Object.keys(this.songs);
                this.currentCategory = allCategories[0];
                this.currentSongIndex = 0;
                this.isLooping = true;
                this.playNextInCategory(volume);
            }
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    playNextFromShuffled(volume) {
        if (!this.shuffledSongs || this.shuffledSongs.length === 0) return;
    
        const sound = this.shuffledSongs[this.currentSongIndex];
        if (sound) {
            this.stop();
            sound.setVolume(volume);
            sound.setLoop(false);
            sound.play();
            this.isPlaying = true;
    
            sound.once('complete', () => {
                this.currentSongIndex = (this.currentSongIndex + 1) % this.shuffledSongs.length;
                if (this.currentSongIndex === 0 && !this.isLooping) {
                    this.isPlaying = false;
                } else {
                    this.playNextFromShuffled(volume);
                }
            });
        }
    }

    // Helper function to play the next song in the current category
    playNextInCategory(volume) {
        if (!this.currentCategory || !this.songs[this.currentCategory]) return;

        const categorySongs = this.songs[this.currentCategory];
        const sound = categorySongs[this.currentSongIndex];

        if (sound) {
            this.stop(); // Stop any current song
            sound.setVolume(volume);
            sound.setLoop(false);
            sound.play();
            this.isPlaying = true;

            sound.once('complete', () => {
                this.currentSongIndex = (this.currentSongIndex + 1) % categorySongs.length;
                if (this.currentSongIndex === 0 && !this.isLooping) {
                    this.isPlaying = false; // Stop playing if not looping
                } else {
                    this.playNextInCategory(volume); // Play the next song
                }
            });
        }
    }

    // Stop all songs
    stop() {
        for (let category in this.songs) {
            this.songs[category].forEach(sound => {
                if (sound.isPlaying) {
                    sound.stop();
                }
            });
        }
        this.isPlaying = false;
    }
}

export default SoundtrackManager;
