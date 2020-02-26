var audioUrl = '';
var videoUrl = '';

Vue.component('stream-switch', {
    props: {
        autoplay: {
            default: true,
            type: Boolean
        },
        azureAudioChannelName: {
            required: true,
            type: String
        },
        azureVideoChannelName: {
            required: true,
            type: String
        },
        firebaseDatabaseName: {
            default: '(default)',
            type: String
        },
        firebaseProjectId: {
            required: true,
            type: String
        },
        offlineImage: {
            required: true,
            type: String
        },
        placeholderImage: {
            required: true,
            type: String
        }
    },

    data() {
        return {
            audioButtonBackgroundColor: 'transparent',
            showSwitcherControls: false,
            showVideoPlayer: false,
            videoButtonBackgroundColor: '#CCCCCC'
        }
    },

    computed: {
        audioStyles: function() {
            return {
                backgroundColor: this.audioButtonBackgroundColor,
                cursor: 'pointer',
                display: 'inline-block',
                padding: '10px'
            }
        },

        videoStyles: function() {
            return {
                backgroundColor: this.videoButtonBackgroundColor,
                cursor: 'pointer',
                display: 'inline-block',
                padding: '10px'
            }
        }
    },

    methods: {
        selectedAudio: function() {
            var playlist = {
                image: this.placeholderImage,
                title: this.azureAudioChannelName.charAt(0).toUpperCase() + this.azureAudioChannelName.slice(1).toLowerCase(),
                sources: [{
                    file: videoUrl + '(format=mpd-time-csf).mpd'
                }, {
                    file: videoUrl + '(format=m3u8-aapl-v3).m3u8'
                }]
            };
            
            jwplayer('stream-switch-jw-player').setup({
                aspectratio: '16:9',
                autostart: this.autoplay,
                controls: true,
                displaydescription: false,
                displaytitle: false,
                playlist: playlist,
                preload: 'metadata',
                primary: 'html5'
            });

            this.audioButtonBackgroundColor = '#CCCCCC';
            this.videoButtonBackgroundColor = 'transparent';
        },

        selectedVideo: function() {
            var playlist = {
                image: this.placeholderImage,
                title: this.azureVideoChannelName.charAt(0).toUpperCase() + this.azureVideoChannelName.slice(1).toLowerCase(),
                mediaId: this.azureVideoChannelName,
                sources: [{
                    file: videoUrl + '(format=mpd-time-csf).mpd'
                }, {
                    file: videoUrl + '(format=m3u8-aapl-v3).m3u8'
                }]
            };

            jwplayer('stream-switch-jw-player').setup({
                aspectratio: '16:9',
                autostart: this.autoplay,
                controls: true,
                displaydescription: false,
                displaytitle: false,
                playlist: playlist,
                preload: 'metadata',
                primary: 'html5'
            });

            this.audioButtonBackgroundColor = 'transparent';
            this.videoButtonBackgroundColor = '#CCCCCC';
        }
    },

    mounted: function () {
        var url = 'https://firestore.googleapis.com/v1/projects/';
        url += this.firebaseProjectId;
        url += '/databases/';
        url += this.firebaseDatabaseName;
        url += '/documents/media';

        var audioChannelName = this.azureAudioChannelName;
        var videoChannelName = this.azureVideoChannelName;
        var vueThis = this;

        axios.get(url)
            .then(function (response) {
                if (response == null || response.data == null || response.data.documents == null) {S
                    return;
                }

                response.data.documents.forEach(function (document) {
                    var name = document.fields['name'].stringValue;
                    var url = document.fields['url'].stringValue;

                    if (name.toLowerCase() == audioChannelName.toLowerCase()) {
                        audioUrl = url;
                    }

                    if (name.toLowerCase() == videoChannelName.toLowerCase()) {
                        videoUrl = url;
                    }
                });

                vueThis.showSwitcherControls = true;
                vueThis.showVideoPlayer = true;
                vueThis.selectedVideo();
            })
            .catch(function () {
                vueThis.showSwitcherControls = false;
                vueThis.showVideoPlayer = false;
            });
    },
    
    template: '<div align="center"><img v-if="!showVideoPlayer" :src="offlineImage" /><video id="stream-switch-jw-player" /><div v-if="showSwitcherControls" align="center"><ul style="margin: 10px 0 0 0; padding: 0;"><li @click="selectedVideo" :style="videoStyles"><img src="https://cdn.jsdelivr.net/gh/literal-life-church/stream-switch@latest/assets/video.png" width="40"><span style="display: block;">{{ azureVideoChannelName.charAt(0).toUpperCase() + azureVideoChannelName.slice(1).toLowerCase() }}</span></li><li @click="selectedAudio" :style="audioStyles"><img src="https://cdn.jsdelivr.net/gh/literal-life-church/stream-switch@latest/assets/audio.png" width="40"><span style="display: block;">{{ azureAudioChannelName.charAt(0).toUpperCase() + azureAudioChannelName.slice(1).toLowerCase() }}</span></li></ul></div></div>'
});
