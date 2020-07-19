/*global axios, ga, jwplayer, Vue*/

Vue.component("stream-switch", {
    props: {
        autoplay: {
            default: true,
            type: Boolean
        },
        azureAudioChannelLabel: {
            required: true,
            type: String
        },
        azureAudioChannelName: {
            required: true,
            type: String
        },
        azureStreamingEndpointName: {
            required: true,
            type: String
        },
        azureVideoChannelLabel: {
            required: true,
            type: String
        },
        azureVideoChannelName: {
            required: true,
            type: String
        },
        liveStreamingApiHost: {
            required: true,
            type: String
        },
        loadingText: {
            default: "Loading the live stream",
            type: String
        },
        offlineText: {
            default: "Live stream is currently offline",
            type: String
        },
        organizationName: {
            required: true,
            type: String
        },
        placeholderImage: {
            required: true,
            type: String
        },
        pollingInterval: {
            default: 0,
            type: Number
        }
    },

    data() {
        return {
            audioButtonBackgroundColor: "transparent",
            audioUrls: { dash: "", hls: "" },
            dynamicMessage: "",
            showSpinner: false,
            showSwitcherControls: false,
            showVideoPlayer: false,
            timer: null,
            videoButtonBackgroundColor: "#CCCCCC",
            videoUrls: { dash: "", hls: "" }
        };
    },

    computed: {
        audioStyles: function () {
            return {
                backgroundColor: this.audioButtonBackgroundColor,
                cursor: "pointer",
                display: "inline-block",
                padding: "10px"
            }
        },

        playerStyle: function () {
            return {
                height: this.showVideoPlayer ? "auto" : "0",
                visibility: this.showVideoPlayer ? "visible" : "hidden"
            }
        },

        videoStyles: function () {
            return {
                backgroundColor: this.videoButtonBackgroundColor,
                cursor: "pointer",
                display: "inline-block",
                padding: "10px"
            }
        }
    },

    methods: {
        generateIngestUrl: function () {
            var events = [];

            if (this.azureAudioChannelName !== null && this.azureAudioChannelName.trim() !== "") {
                events.push(this.azureAudioChannelName.trim());
            }

            if (this.azureVideoChannelName !== null && this.azureVideoChannelName.trim() !== "") {
                events.push(this.azureVideoChannelName.trim());
            }

            var url = "https://";
            url += this.liveStreamingApiHost;
            url += "/api/v1/viewer/locators?endpoint=";
            url += this.azureStreamingEndpointName;
            url += "&events=";
            url += events.join();

            return url;
        },

        generatePlaylist: function (channelName, channelLabel, urls) {
            var dashUrl = urls.dash;
            var hlsUrl = urls.hls;
            var sourceUrls = [];

            if (dashUrl !== null && dashUrl.trim() !== "") {
                sourceUrls.push({ file: dashUrl });
            }

            if (hlsUrl !== null && hlsUrl.trim() !== "") {
                sourceUrls.push({ file: hlsUrl });
            }

            return {
                image: this.placeholderImage,
                mediaid: channelName,
                title: channelLabel + " Stream from " + this.organizationName,
                sources: sourceUrls
            };
        },

        initializeJwPlayer: function (playlist) {
            jwplayer("stream-switch-jw-player").setup({
                aspectratio: "16:9",
                autostart: this.autoplay,
                controls: true,
                playlist: playlist,
                preload: "metadata",
                primary: "html5",
                ga: {
                    label: "mediaid"
                }
            });

            jwplayer().on("error", function (event) {
                ga("send", "event", "JW Player Events", "Error", "Code", event.code);
            });
        },

        loadManifest: function() {
            var url = this.generateIngestUrl();
            var vm = this;

            this.dynamicMessage = this.loadingText;
            this.showSpinner = true;
            this.showSwitcherControls = false;
            this.showVideoPlayer = false;

            axios.get(url)
                .then(function (response) {
                    if (response === null || response.data === null || response.data.events === null) {
                        return;
                    }

                    var hasAudioUrl = false;
                    var hasVideoUrl = false;

                    response.data.events.forEach(function (liveEvent) {
                        if (!liveEvent.isLive) {
                            return;
                        }

                        liveEvent.locators.forEach(function (locator) {
                            if (liveEvent.name.toLowerCase() === vm.azureAudioChannelName.toLowerCase()) {
                                hasAudioUrl = true;

                                if (locator.type.toLowerCase() === "dash") {
                                    vm.audioUrls.dash = locator.url;
                                }

                                if (locator.type.toLowerCase() === "hls") {
                                    vm.audioUrls.hls = locator.url;
                                }
                            }

                            if (liveEvent.name.toLowerCase() === vm.azureVideoChannelName.toLowerCase()) {
                                hasVideoUrl = true;

                                if (locator.type.toLowerCase() === "dash") {
                                    vm.videoUrls.dash = locator.url;
                                }

                                if (locator.type.toLowerCase() === "hls") {
                                    vm.videoUrls.hls = locator.url;
                                }
                            }
                        });
                    });

                    vm.showSpinner = false;

                    if (!hasAudioUrl && !hasVideoUrl) {
                        vm.dynamicMessage = vm.offlineText;
                        return;
                    }

                    vm.showSwitcherControls = response.data.isAllLive;
                    vm.showVideoPlayer = response.data.isAnyLive;

                    if (hasVideoUrl) {
                        vm.selectedVideo();
                    } else {
                        vm.selectedAudio();
                    }

                    if (vm.timer !== null) {
                        clearInterval(vm.timer);
                    }
                })
                .catch(function () {
                    vm.dynamicMessage = this.offlineText;
                    vm.showSpinner = false;
                });
        },

        selectedAudio: function () {
            var playlist = this.generatePlaylist(
                this.azureAudioChannelName,
                this.azureAudioChannelLabel,
                this.audioUrls
            );

            this.initializeJwPlayer(playlist);
            this.audioButtonBackgroundColor = "#CCCCCC";
            this.videoButtonBackgroundColor = "transparent";
        },

        selectedVideo: function () {
            var playlist = this.generatePlaylist(
                this.azureVideoChannelName,
                this.azureVideoChannelLabel,
                this.videoUrls
            );

            this.initializeJwPlayer(playlist);
            this.audioButtonBackgroundColor = "transparent";
            this.videoButtonBackgroundColor = "#CCCCCC";
        }
    },

    mounted: function () {
        this.loadManifest();

        if (this.pollingInterval >= 15) {
            var time = this.pollingInterval * 1000;
            this.timer = setInterval(this.loadManifest, time);
        }
    },

    template: "<div align=\"center\"><div v-if=\"!showVideoPlayer\"><div style=\"float: left; position: relative;\"><img :src=\"placeholderImage\" /><div style=\"bottom: 0px; left: 0px; position: absolute; right: 0px; top: 0px;\"><div style=\"height: 50%; max-height: 50%; min-height: 50%; width: 100%;\"></div><div style=\"height: 50%; max-height: 50%; min-height: 50%; width: 100%;\"><div style=\"align-items: center; display: flex; height: 100%; justify-content: center; width: 100%;\"><div><i class=\"fa fa-spinner fa-pulse fa-3x fa-fw\" v-if=\"showSpinner\"></i><span class=\"sr-only\" v-if=\"showSpinner\">>Loading...</span><p style=\"font-weight: bold; font-size: 24px;\">{{ dynamicMessage }}</p></div></div></div></div></div></div><div :style=\"playerStyle\"><video id=\"stream-switch-jw-player\" /></div><div align=\"center\" v-if=\"showSwitcherControls\"><ul style=\"margin: 10px 0 0 0; padding: 0;\"><li @click=\"selectedVideo\" :style=\"videoStyles\"><i aria-hidden=\"true\" class=\"fa fa-film\" style=\"font-size: 2em; padding-bottom: 8px;\"></i><span style=\"display: block;\">{{ azureVideoChannelLabel }}</span></li><li @click=\"selectedAudio\" :style=\"audioStyles\"><i aria-hidden=\"true\" class=\"fa fa-volume-up\" style=\"font-size: 2em; padding-bottom: 8px;\"></i><span style=\"display: block;\">{{ azureAudioChannelLabel }}</span></li></ul></div></div>"
});
