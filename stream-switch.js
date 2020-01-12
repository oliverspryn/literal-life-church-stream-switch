var options = null;
var player = null;

var audioUrl = '';
var videoUrl = '';

Vue.component('stream-switch', {
    props: {
        applicationInsightsInstrumentationKey: {
            default: '',
            type: String
        },
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
            if (this.applicationInsightsInstrumentationKey != '') {
                options.plugins.appInsights.streamId = this.azureAudioChannelName.toLowerCase();
            }

            player.src([{
                src: audioUrl,
                type: 'application/vnd.ms-sstr+xml'
            }]);

            this.audioButtonBackgroundColor = '#CCCCCC';
            this.videoButtonBackgroundColor = 'transparent';
        },

        selectedVideo: function() {
            if (this.applicationInsightsInstrumentationKey != '') {
                options.plugins.appInsights.streamId = this.azureVideoChannelName.toLowerCase();
            }

            player.src([{
                src: videoUrl,
                type: 'application/vnd.ms-sstr+xml'
            }]);

            this.audioButtonBackgroundColor = 'transparent';
            this.videoButtonBackgroundColor = '#CCCCCC';
        }
    },

    mounted: function () {

        // region Azure Application Insights
        // Source: https://docs.microsoft.com/en-us/azure/azure-monitor/app/website-monitoring#configure-app-insights-sdk

        if (this.applicationInsightsInstrumentationKey != '') {
            var sdkInstance="appInsightsSDK";window[sdkInstance]="appInsights";var aiName=window[sdkInstance],aisdk=window[aiName]||function(e){function n(e){t[e]=function(){var n=arguments;t.queue.push(function(){t[e].apply(t,n)})}}var t={config:e};t.initialize=!0;var i=document,a=window;setTimeout(function(){var n=i.createElement("script");n.src=e.url||"https://az416426.vo.msecnd.net/scripts/b/ai.2.min.js",i.getElementsByTagName("script")[0].parentNode.appendChild(n)});try{t.cookie=i.cookie}catch(e){}t.queue=[],t.version=2;for(var r=["Event","PageView","Exception","Trace","DependencyData","Metric","PageViewPerformance"];r.length;)n("track"+r.pop());n("startTrackPage"),n("stopTrackPage");var s="Track"+r[0];if(n("start"+s),n("stop"+s),n("setAuthenticatedUserContext"),n("clearAuthenticatedUserContext"),n("flush"),!(!0===e.disableExceptionTracking||e.extensionConfig&&e.extensionConfig.ApplicationInsightsAnalytics&&!0===e.extensionConfig.ApplicationInsightsAnalytics.disableExceptionTracking)){n("_"+(r="onerror"));var o=a[r];a[r]=function(e,n,i,a,s){var c=o&&o(e,n,i,a,s);return!0!==c&&t["_"+r]({message:e,url:n,lineNumber:i,columnNumber:a,error:s}),c},e.autoExceptionInstrumented=!0}return t}(
            {
                instrumentationKey: this.applicationInsightsInstrumentationKey
            }
            );window[aiName]=aisdk,aisdk.queue&&0===aisdk.queue.length&&aisdk.trackPageView({});
        }

        // endregion

        var url = 'https://firestore.googleapis.com/v1/projects/';
        url += this.firebaseProjectId;
        url += '/databases/';
        url += this.firebaseDatabaseName;
        url += '/documents/media';

        options = {
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

        if (this.applicationInsightsInstrumentationKey != '') {
            options.plugins = {
                appInsights: {
                    'streamId': this.azureVideoChannelName.toLowerCase(), // Defaults to the video stream
                    'metricsToTrack': [
                        'playbackSummary',
                        'loaded',
                        'viewed',
                        'ended',
                        'playTime',
                        'percentsPlayed',
                        'play',
                        'pause',
                        'seek',
                        'fullscreen',
                        'error',
                        'buffering',
                        'bitrateQuality',
                        'downloadInfo'
                    ]
                }
            };
        }

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
