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
        organizationName: {
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
            audioUrl: '',
            showSwitcherControls: false,
            showVideoPlayer: false,
            videoButtonBackgroundColor: '#CCCCCC',
            videoUrl: ''
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

        playerStyle: function() {
            return {
                height: this.showVideoPlayer ? 'auto' : '0',
                visibility: this.showVideoPlayer ? 'visible' : 'hidden'
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
            var title = this.azureAudioChannelName.charAt(0).toUpperCase() + this.azureAudioChannelName.slice(1).toLowerCase();
            title = title + ' Stream from ' + this.organizationName;

            var playlist = {
                image: this.placeholderImage,
                mediaid: this.azureAudioChannelName,
                title: title,
                sources: [{
                    file: this.audioUrl + '(format=mpd-time-csf).mpd'
                }, {
                    file: this.audioUrl + '(format=m3u8-aapl-v3).m3u8'
                }]
            };
            
            jwplayer('stream-switch-jw-player').setup({
                aspectratio: '16:9',
                autostart: this.autoplay,
                controls: true,
                playlist: playlist,
                preload: 'metadata',
                primary: 'html5',
                ga: {
                    label: 'mediaid'
                }
            });

            jwplayer().on('error', function(event) {
                ga('send', 'event', 'JW Player Events', 'Error', 'Code', event.code);
            });

            this.audioButtonBackgroundColor = '#CCCCCC';
            this.videoButtonBackgroundColor = 'transparent';
        },

        selectedVideo: function() {
            var title = this.azureVideoChannelName.charAt(0).toUpperCase() + this.azureVideoChannelName.slice(1).toLowerCase();
            title = title + ' Stream from ' + this.organizationName;

            var playlist = {
                image: this.placeholderImage,
                mediaid: this.azureVideoChannelName,
                title: title,
                sources: [{
                    file: this.videoUrl + '(format=mpd-time-csf).mpd'
                }, {
                    file: this.videoUrl + '(format=m3u8-aapl-v3).m3u8'
                }]
            };

            jwplayer('stream-switch-jw-player').setup({
                aspectratio: '16:9',
                autostart: this.autoplay,
                controls: true,
                playlist: playlist,
                preload: 'metadata',
                primary: 'html5',
                ga: {
                    label: 'mediaid'
                }
            });

            jwplayer().on('error', function(event) {
                ga('send', 'event', 'JW Player Events', 'Error', 'Code', event.code);
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
        var vm = this;

        axios.get(url)
            .then(function (response) {
                if (response == null || response.data == null || response.data.documents == null) {
                    return;
                }

                response.data.documents.forEach(function (document) {
                    var name = document.fields['name'].stringValue;
                    var url = document.fields['url'].stringValue;

                    if (name.toLowerCase() == audioChannelName.toLowerCase()) {
                        vm.audioUrl = url;
                    }

                    if (name.toLowerCase() == videoChannelName.toLowerCase()) {
                        vm.videoUrl = url;
                    }
                });

                vm.showSwitcherControls = true;
                vm.showVideoPlayer = true;
                vm.selectedVideo();
            })
            .catch(function () {
                vm.showSwitcherControls = false;
                vm.showVideoPlayer = false;
            });
    },
    
    template: '<div align="center"><img v-if="!showVideoPlayer" :src="offlineImage" /><div :style="playerStyle"><video id="stream-switch-jw-player" /></div><div v-if="showSwitcherControls" align="center"><ul style="margin: 10px 0 0 0; padding: 0;" v-if="audioUrl != \'\' && videoUrl != \'\'"><li @click="selectedVideo" :style="videoStyles"><img src="https://cdn.jsdelivr.net/gh/literal-life-church/stream-switch@latest/assets/video.png" width="40"><span style="display: block;">{{ azureVideoChannelName.charAt(0).toUpperCase() + azureVideoChannelName.slice(1).toLowerCase() }}</span></li><li @click="selectedAudio" :style="audioStyles"><img src="https://cdn.jsdelivr.net/gh/literal-life-church/stream-switch@latest/assets/audio.png" width="40"><span style="display: block;">{{ azureAudioChannelName.charAt(0).toUpperCase() + azureAudioChannelName.slice(1).toLowerCase() }}</span></li></ul></div></div>'
});
