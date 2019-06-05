var player = null;

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
        controls: {
            default: true,
            type: Boolean
        },
        errorMessage: {
            default: 'Please check back during our regular service hours to view our live streaming',
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
        height: {
            default: 'auto',
            type: null
        },
        nativeControlsForTouch: {
            default: false,
            type: Boolean
        },
        width: {
            default: '100%',
            type: null
        }
    },

    data() {
        return {
            audioButtonBackgroundColor: 'transparent',
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
            player.src([{
                src: audioUrl,
                type: 'application/vnd.ms-sstr+xml'
            }]);

            this.audioButtonBackgroundColor = '#CCCCCC';
            this.videoButtonBackgroundColor = 'transparent';
        },

        selectedVideo: function() {
            player.src([{
                src: videoUrl,
                type: 'application/vnd.ms-sstr+xml'
            }]);

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

        var options = {
            autoplay: this.autoplay,
            controls: this.controls,
            nativeControlsForTouch: this.nativeControlsForTouch,

            logo: {
                enabled: false
            },

            fluid: true,
            height: this.height,
            width: this.width
        };

        var error = this.errorMessage;
        var audioChannelName = this.azureAudioChannelName;
        var videoChannelName = this.azureVideoChannelName;

        player = amp('stream-switch-amp', options);

        player.addEventListener('error', function () {
            var message = document.querySelectorAll('#stream-switch-amp div.vjs-modal-dialog-content')[0];
            message.innerText = error;
        });

        axios.get(url)
            .then(function (response) {
                if (response == null || response.data == null || response.data.documents == null) {
                    player.src([{
                        src: '',
                        type: 'application/vnd.ms-sstr+xml'
                    }]);

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

                player.src([{
                    src: videoUrl,
                    type: 'application/vnd.ms-sstr+xml'
                }]);
            })
            .catch(function () {
                player.src([{
                    src: '',
                    type: 'application/vnd.ms-sstr+xml'
                }]);
            });
    },
    
    template: '<div><video id="stream-switch-amp" class="azuremediaplayer amp-default-skin amp-big-play-centered" tabindex="0" /><div align="center"><ul style="margin: 10px 0 0 0; padding: 0;"><li @click="selectedVideo" :style="videoStyles"><img src="https://cdn.jsdelivr.net/gh/literal-life-church/stream-switch@latest/assets/video.png" width="40"><span style="display: block;">{{ azureVideoChannelName.charAt(0).toUpperCase() + azureVideoChannelName.slice(1).toLowerCase() }}</span></li><li @click="selectedAudio" :style="audioStyles"><img src="https://cdn.jsdelivr.net/gh/literal-life-church/stream-switch@latest/assets/audio.png" width="40"><span style="display: block;">{{ azureAudioChannelName.charAt(0).toUpperCase() + azureAudioChannelName.slice(1).toLowerCase() }}</span></li></ul></div></div>'
});
