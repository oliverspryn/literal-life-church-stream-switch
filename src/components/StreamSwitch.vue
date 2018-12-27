<template>
    <video id="stream-switch-video" class="azuremediaplayer amp-default-skin amp-big-play-centered">
      <p class="amp-no-js">To view this video please enable JavaScript, and consider upgrading to a web browser that supports HTML5 video</p>
    </video>
</template>

<script>
export default {
  name: 'StreamSwitch',
  props: {
    videoSrc: {
      required: true,
      type: String
    }
  },
  mounted: () => {
    const options = {
      autoplay: true,
      controls: true,
      nativeControlsForTouch: false,
    
      logo: {
        enabled: false
      },
    
      fluid: true,
      height: 'auto',
      width: '100%'
    };

    const player = amp('stream-switch-video', options);
    const src = this.videoSrc;
    console.log(this);

    player.src([{
			src: src,
			type: 'application/vnd.ms-sstr+xml'
		}]);
  }
};
</script>
