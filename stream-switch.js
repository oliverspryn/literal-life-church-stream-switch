Vue.component('stream-switch', {
    props: {
        autoplay: {
            default: true,
            type: Boolean
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

        var player = amp('stream-switch-amp', options);

        var error = this.errorMessage;
        var videoChannelName = this.azureVideoChannelName;

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

                var videoUrl = '';

                response.data.documents.forEach(function (document) {
                    var name = document.fields['name'].stringValue;
                    var url = document.fields['url'].stringValue;

                    if (name.toLowerCase() == videoChannelName.toLowerCase()) {
                        videoUrl = url;
                    }
                });

                player.src([{
                    src: videoUrl,
                    type: 'application/vnd.ms-sstr+xml'
                }]);
            })
            .catch(function (error) {
                player.src([{
                    src: '',
                    type: 'application/vnd.ms-sstr+xml'
                }]);
            });
    },

    template: '<video id="stream-switch-amp" class="azuremediaplayer amp-default-skin amp-big-play-centered" tabindex="0"></video>'
});
