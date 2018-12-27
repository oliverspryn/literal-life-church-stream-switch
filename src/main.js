import Vue from "vue";
import StreamSwitch from "./components/StreamSwitch";

let MainComponent = Vue.extend(StreamSwitch);

new MainComponent().$mount("#app");
