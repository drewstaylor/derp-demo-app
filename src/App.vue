<template>
  <div class="content" v-if="!connected">
    <div class="frame">
      <div class="logo"></div>
      <ul>
          <li class="bar"><a href="https://derpies.io" target="blank_">Derpies.io</a></li>
        </ul>
    </div>
    <div class="connect">
        <div class="ascii"></div>
        <p class="login descr">
          <span v-if="!connecting">Welcome to Derpies AI</span>
          <span v-else>Logging into Derpies AI</span>
        </p>
        <ul class="connect-opts" v-if="!connecting">
          <li 
            class="btn-connect" 
            @click="connectWallet('keplr')" 
          ><div class="icon keplr"></div>Keplr</li>
          <li 
            class="btn-connect" 
            @click="connectWallet('cosmostation')"
          ><div class="icon cosmostation"></div>Cosmostation</li>
          <li 
            class="btn-connect" 
            @click="connectWallet('leap')"
          ><div class="icon leap"></div>Leap</li>
          <li 
            class="btn-connect" 
            @click="connectWallet('metamask')"
          ><div class="icon metamask"></div>MetaMask</li>
        </ul>
        <div class="loading connecting" v-else>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
  </div>
  <div class="content" v-else>
    <div class="frame">
      <div class="logo"></div>
        <ul>
          <li class="hide bar">Friends (0)</li>
          <li class="bar"><a href="https://derpies.io" target="blank_">Derpies.io</a></li>
          <li class="bar logout"><a class="pointer logout" @click="disconnectWallet();">Log Out</a></li>
        </ul>
      </div>
      <div class="col-1">
        <h1>Derp Profile</h1>
        <div class="options">
          <select class="form-control question item" v-model="voices.selected" @change="derpieChanged($event);">
            <option v-for="(voice, i) in voices.options" :key="'voice-'+i" :value="voice.value">{{voice.name}}</option>
          </select>
        </div>
        <div :class="['derp', voiceClass]" v-if="!animating">
          <div v-if="audio && voices.list.length">
            <input
              class="voice-toggle on"
              type="checkbox"
              v-model="audio"
              :true-value="true"
              :false-value="false"
              :disabled="voices.selected == voices.list[voices.list.length-1]"
              name="audio"
            />
          </div>
          <div v-else>
            <input
              class="voice-toggle off"
              type="checkbox"
              v-model="audio"
              :true-value="true"
              :false-value="false"
              :disabled="voices.selected == voices.list[voices.list.length-1]"
              name="audio"
            />
          </div>
        </div>
        <div class="derp animation" v-else>
          <Vue3Lottie
            :animationLink="voices.animations[voices.selected]"
          />
        </div>

        <div class="v-flex">
          <a href="https://x.com/Derpies_NFT" target="blank_">
            <button class="alt">X / Twitter</button>
          </a>
          <a href="https://discord.com/invite/ggfCgapG9P" target="blank_">
            <button class="alt">Derpcord</button>
          </a>
          <a href="https://hub.xyz/derpies" target="blank_">
            <button class="alt">More Links</button>
          </a>
        </div>
      </div>
      <div class="col-2">
      <!-- Chat Log -->
      <div class="chat-log" id="chat-log">
        <div class="chat-item" v-for="(chatEntry, i) in chatLog" :key="'chat-item-'+i">
          <div 
            :class="{
              you: chatEntry.speaker == 'You', 
              bot: chatEntry.speaker !== 'You', 
              author: true
            }" 
            v-if="chatEntry.speaker"
          >{{chatEntry.speaker}}<span v-if="chatEntry.style">&nbsp;({{chatEntry.style}})</span>:</div>
          <div 
            :class="{
              message: true, 
              info: !chatEntry.speaker
            }" 
            v-if="chatEntry.message"
            v-html="chatEntry.message"
          ></div>
        </div>
        <div class="loading" v-if="loading">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <!-- Chat Input -->
      <div class="chat-input">
        <div class="h-flex">
          <input 
            placeholder="Ask Derpie a question" 
            class="form-control" 
            type="text" 
            name="question" 
            v-model="question" 
          />
          <button class="btn btn-primary" @click="ask()">Send</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Audio Player -->
  <div class="audio">
    <audio id="derp_voice" :autoplay="audio" v-if="audioUrl" :key="audioRender">
      <source :src="audioUrl" type="audio/mpeg" />
    </audio>
  </div>
</template>

<script>
import { Client, Accounts } from './util/client';
import { Vue3Lottie } from 'vue3-lottie';
import * as api from './util/api';
import * as showdown from 'showdown';

import 'vue3-lottie/dist/style.css'

const API_URL = process.env.VUE_APP_API_URL;
const API_AUDIO_PATH = '/static/';
const API_FILE_EXT = '.mp3';

const MAX_CONVERSATION_SIZE = 5;

const VOICE_OG = 0;
const VOICE_BIG_BRAIN = 1;
const VOICE_SEXY = 2;
const VOICE_SENSITIVE = 3;
const VOICE_DRUMP = 4;

const VOICES = [VOICE_OG, VOICE_BIG_BRAIN, VOICE_SEXY, VOICE_SENSITIVE, VOICE_DRUMP];

const ANIMATION_OG = '/assets/animation/og.json';
const ANIMATION_BIG_BRAIN = '/assets/animation/bigbrain.json';
const ANIMATION_SEXY = '/assets/animation/sexy.json';
const ANIMATION_SENSITIVE = '/assets/animation/sensitive.json';
const ANIMATION_DRUMP = '/assets/animation/drump.json';

const ANIMATIONS = [ANIMATION_OG, ANIMATION_BIG_BRAIN, ANIMATION_SEXY, ANIMATION_SENSITIVE, ANIMATION_DRUMP];

export default {
  name: 'Derpies_AI_Assistant',
  components: { Vue3Lottie },
  data: () => ({
    api,
    voices: {
      options: [
        {value: VOICE_OG, name: "OG Derp"},
        {value: VOICE_BIG_BRAIN, name: "Big Brain Derp"},
        {value: VOICE_SEXY, name: "Sexy Derp"},
        {value: VOICE_SENSITIVE, name: "Sensitive Derp"},
        {value: VOICE_DRUMP, name: "Drump Derp"},
      ],
      animations: ANIMATIONS,
      list: VOICES,
      selected: VOICE_OG
    },
    chatLog: [],
    question: null,
    previousQuestions: [],
    audio: false,
    audioUrl: null,
    audioRender: 0,
    animating: false,
    user: null,
    connected: false,
    connecting: false,
    walletTypes: ['keplr', 'cosmostation', 'leap', 'metamask'],
    walletType: null,
    loading: false,
    converter: new showdown.Converter(),
  }),
  computed: {
    voiceClass() {
      // Mapping the selected voice value to a class name
      const voiceMap = {
        [VOICE_OG]: 'voice-og',
        [VOICE_BIG_BRAIN]: 'voice-big-brain',
        [VOICE_SEXY]: 'voice-sexy',
        [VOICE_SENSITIVE]: 'voice-sensitive',
        [VOICE_DRUMP]: 'voice-drump',
      };
      return voiceMap[this.voices.selected] || 'voice-default';
    }
  },
  mounted: async function () {
    if (window) {
      let connected = window.sessionStorage.getItem('connected');
      if (connected) {
        this.resumeConnectedState();
        this.connected = true;
      }
    }

    // Submit questions using 'Enter' key
    document.onkeypress = (e) => {
      e = e || window.event;
      const k = e.key;
      if (k === 'Enter') {
        if (!this.question || typeof this.question !== "string") return;
        if (!this.question.length) return;
        this.ask();
      }
    };
  },
  methods: {
    connectWallet: async function (wallet = "keplr") {
      if (this.walletTypes.indexOf(wallet) == -1) return;
      this.connecting = true;
      this.walletType = wallet;
      try {
        this.cwClient = await Client(this.walletType);
        this.accounts = await Accounts(this.cwClient);
        if (!this.accounts[0].address) return;
        else this.user = this.accounts[0].address;
        this.connected = true;
        this.connecting = false;
        window.sessionStorage.setItem('connected', this.walletType);
        this.chatInit();
      } catch(e) {
        this.connected = false;
        this.connecting = false;
        console.error(e);
      }
    },
    resumeConnectedState: async function (attempts = 0) {
      if (attempts >= 5) {
        return;
      }
      try {
        setTimeout(async () => { 
          let walletType = sessionStorage.getItem("connected");
          this.cwClient = await Client(walletType);
          this.accounts = await Accounts(this.cwClient);
          if (this.accounts[0].address) this.user = this.accounts[0].address;
          this.chatInit();
        }, 100);
      } catch (e) {
        await this.resumeConnectedState((attempts + 1));
      }
    },
    disconnectWallet: async function () {
      sessionStorage.removeItem("connected");
      window.location.reload();
    },
    chatInit: function () {
      if (!this.user) return;
      this.chatLog.push(
        {message: "Derpie has entered the chat"},
        {message: this.user + " (you) entered the chat"},
      );
    },
    ask: async function () {
      this.audioUrl = false;
      this.animating = false;
      this.loading = true;
      if (!this.question) return;
      
      let question = JSON.stringify(this.question);
      this.question = null;

      if (this.voices.list.indexOf(this.voices.selected) == -1) this.voices.selected = VOICE_OG;

      let req = {
        question: JSON.parse(question), 
        voice: this.voices.selected,
        user: this.user
      };

      if (this.audio && this.voices.selected !== VOICE_DRUMP) req.audio = true;
      if (this.previousQuestions.length) req.messages = this.previousQuestions;

      let resp = await this.api.request.post('/', req);
      let d = (resp.data) ? resp.data : {};
      if (d.chat) {
        let userChatEntry = {
          speaker: "You",
          style: null,
          message: JSON.parse(question)
        };
        let apiChatEntry = {
          speaker: "Derpie",
          style: this.voices.options[this.voices.selected].name,
          message: this.sanitized(d.chat)
        };
        this.chatLog.push(userChatEntry, apiChatEntry);

        if (this.audio) {
          this.audioUrl = API_URL + API_AUDIO_PATH + this.user + API_FILE_EXT + "?t=" + new Date().getTime();
          ++this.audioRender;
          this.animating = true;
        }
        
        if (this.previousQuestions.length == MAX_CONVERSATION_SIZE) this.previousQuestions.shift();
        let prev = [
          {"role": "user","content": JSON.parse(question)},
          {"role": "assistant","content": d.chat}
        ];
        this.previousQuestions.push(prev);
        
        this.loading = false;

        this.$nextTick(() => {
          if (this.audio) {
            // XXX TODO: Fix this hacky nonsense
            // if anyone else reads this, pity me...
            setTimeout(()=> {
              const player = document.getElementById('derp_voice');
              setTimeout(()=>{
                this.animating = false;
              }, (player.duration * 1000)-1000);
            }, 1000);
          }

          const elem = document.getElementById('chat-log');
          elem.scrollTop = elem.scrollHeight;
        });
      } else {
        this.loading = false;
      }
    },
    derpieChanged: function (e) {
      if (!e.target) return;
      else if (!e.target.value) return;
      const voice = parseInt(e.target.value);
      if (this.voices.list.indexOf(voice) == -1) return;
      // Clear chat history when changing to a new assistant
      this.previousQuestions = [];
      // Disable voice if Drump
      if (voice == this.voices.list[this.voices.list.length-1]) this.audio = false;
    },
    sanitized: function (dirty) {
      return this.converter.makeHtml(dirty);
    },
  }
}

</script>
<style>
@font-face {
    font-family: 'handwritten_crystal_v2regular';
    src: url('/public/fonts/handwritten_crystal_v2-webfont.woff2') format('woff2'),
         url('/public/fonts/handwritten_crystal_v2-webfont.woff') format('woff');
    font-weight: normal;
    font-style: normal;

}
#app {
  font-family: Inter, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100vh;
  overflow: hidden;
}
textarea:focus, input:focus, select:focus {
    outline: none;
}
body {
  background-color: #8cccb5;
  height: 100vh;
  margin: 0px;
  background-image: url(/public/assets/bg.svg);
  background-size: cover;
  background-position: bottom;
  background-repeat: no-repeat;
}
div.content {
  text-align: left;
  margin: auto;
  width: 90vw;
  max-width: 1280px;
  background-color: #E9E7D8;
  border: 3px solid #000000;
  position: relative;
  height: calc(100% - 64px);
  border-radius: 16px;
  overflow: hidden;
  margin-top: 32px;
  margin-bottom: 32px;
  display: flex;
  flex-direction: horizontal;
  font-size: 16px;
}
div.connect {
  position: relative;
  margin: auto;
  display: flex;
  flex-direction: column;
}
.icon{
  display: block;
  width: 24px;
  height: 24px;
  margin-right: 8px;
}
.icon.keplr{
 background-image: url(/public/assets/logo-kelpr.png);
 background-size: contain;
 background-position: center;
 background-repeat: no-repeat;
}
.icon.metamask{
 background-image: url(/public/assets/logo-metamask.png);
 background-size: contain;
 background-position: center;
 background-repeat: no-repeat;
}
.icon.leap{
 background-image: url(/public/assets/logo-leap.png);
 background-size: contain;
 background-position: center;
 background-repeat: no-repeat;
}
.icon.cosmostation{
 background-image: url(/public/assets/logo-cosmostation.png);
 background-size: contain;
 background-position: center;
 background-repeat: no-repeat;
}
p.login.descr {
  margin-top: 1em;
  text-align: center;
}
ul.connect-opts{
  display: flex;
  flex-direction: column;
  padding: 0;
  align-items: center;
}
ul.connect-opts li {
  padding: 1rem;
  margin-bottom: 0.5em;
  border-radius: 8px;
  background-color: rgba(255,255,255,1);
  text-decoration: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  max-width: 400px;
  width: 100%;
}
ul.connect-opts li:hover {
  opacity: 0.75;
}
div.loading {
  position: relative;
  margin: auto;
}
div.loading.connecting {
    position: relative;
    width: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 8px;
}
div.loading span {
  content: "";
  -webkit-animation: loader 1.5s infinite;
  animation: loader 1.5s infinite;
  -webkit-animation-fill-mode: both;
  animation-fill-mode: both;
  height: 8px;
  width: 8px;
  background: #0353E6;
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 50%;
}
.loading span:nth-child(2) {
  -webkit-animation-delay: 0.2s;
  animation-delay: 0.2s;
  margin-left: 15px;
}
.loading span:nth-child(3) {
  -webkit-animation-delay: 0.4s;
  animation-delay: 0.4s;
  margin-left: 30px;
}
.chat-log, .chat-input {
  padding: 1.5em;
  border-radius: 4px;
}
div.ascii{
 width: 600px;
 height: 150px;
 background-image: url(/public/assets/ascii.svg);
 background-size: contain;
 background-position: center;
 background-repeat: no-repeat;
}
.chat-log {
  margin: 16px;
  margin-top: 64px;
  height: calc(100% - 208px);
  overflow-y: scroll;
  background-color: rgba(255,255,255,0.3);
  border-radius: 8px;
  font-size: 14px;
}
.frame {
  content: '';
  display: flex;
  justify-content: space-between;
  background-color: #0353E6;
  position: absolute;
  width: 100%;
  Height: 48px;
  left: 0;
  top: 0;
  border-bottom: 3px solid #000000;
  z-index: 99;
}
.logo {
  width: 128px;
  height: 32px;
  display: block;
  background-image: url('/public/assets/logo.svg');
  margin: auto 0;
  margin-left: 16px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}
.chat-input {
/*  border: 1px solid rgba(0, 0, 0, 0.08); */
  border-radius: 8px;
  margin: 16px;
  background-color: rgba(255,255,255, 1);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  font-size: 14px;
}
.options {
  margin-top: 16px;
  padding-bottom: 0;
  margin-left: 16px;
  margin-right: 16px;
  margin-bottom: -8px;
  width: calc(100% - 32px);
  background-color: #fff;
  border-radius: 8px;
}
.h-flex {
  display: flex;
  flex-direction: horizontal;
}
.v-flex {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: auto;
  justify-content: flex-start;
  width: calc(100% - 32px);
  margin: auto;
}
select {
  border: none;
  background: none;
  width: calc(100% - 8px);
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  cursor: pointer;
  height: 48px;
  background: url(data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6IzQ0NDt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPmFycm93czwvdGl0bGU+PHJlY3QgY2xhc3M9ImNscy0xIiB3aWR0aD0iNC45NSIgaGVpZ2h0PSIxMCIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIxLjQxIDQuNjcgMi40OCAzLjE4IDMuNTQgNC42NyAxLjQxIDQuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMy41NCA1LjMzIDIuNDggNi44MiAxLjQxIDUuMzMgMy41NCA1LjMzIi8+PC9zdmc+) no-repeat 100% 50%;
    -moz-appearance: none; 
    -webkit-appearance: none; 
    appearance: none;
    background-size: 16px;
}
select:hover {
  opacity: 0.5;
}
input {
  flex-grow: 1;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  height: auto;
  border: none;
  background: none;
  font-size: 14px;
}
.info {
  color: rgba(0,0,0,0.4);
  overflow-wrap: break-word;
}
.author, .message {
  margin-top: 1em;
  margin-bottom: 1em;
}
.author {
  font-weight: bold;
}
.author.bot {
  color: violet;
}
.author.you {
  color: blue;
}
.author.bot span, .info {
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  unicode-bidi: isolate;
  font-style: italic;
}
ul {
  decoration: none;
  list-style-type: none;
  display: flex;
  flex-direction: horizontal;
}
li.bar {
  color: #fff;
}
li.bar.logout a{
  margin-left:0;
}
li a {
  color: #fff;
  margin-left: 16px;
  margin-right: 16px;
}
.col-1 {
  width: 25%;
  display:block;
  height: calc(100% - 80px);
  background-color: rgba(255,255,255,0.3);
  border-radius: 8px;
  margin-top: 64px;
  margin-left: 16px;
  overflow-y: scroll;
}
.col-2 {
  width: 75%;
  display:block;
  position: relative;
  height: 100%;
}
.derp {
  width: calc(100% - 32px);
  margin: 16px;
  background-size: cover;
  height: auto;
  border-radius: 8px;
  background-position: center;
  aspect-ratio : 1 / 1;
}
h1 {
  font-size: 1.5rem;
  margin: 16px;
  margin-bottom: 8px;
  font-family: handwritten_crystal_v2regular;
}
button {
  border:none;
  border-radius:4px;
  padding-left:16px;
  padding-right:16px;
  background-color: #0353E6;
  color: #fff;
  cursor: pointer;
}
button:hover {
  opacity: 0.7;
}
button.alt {
  border:none;
  display: flex;
  border-radius:4px;
  padding: 16px;
  background-color: rgba(255,255,255,0.3);
  color: #0353E6;
  width: 100%;
  text-align: left;
  align-items: center;
  gap: 8px;
}
.logout {
  text-decoration: underline;
}
.voice-default, .voice-og {
  background-image: url('/public/assets/OG.png')
}
.voice-sexy {
  background-image: url('/public/assets/Sexy.png')
}
.voice-big-brain {
  background-image: url('/public/assets/Big-Brain.png')
}
.voice-sensitive {
  background-image: url('/public/assets/Sensitive.png')
}
.voice-drump {
  background-image: url('/public/assets/Drump.png')
}
.voice-toggle {
  display: flex;
  width: 48px;
  height: 48px;
  margin: 8px;
  position: relative;
  appearance: none;
  -webkit-appearance: none;
  background-color: #fff;
  border-radius: 8px;
  align-items: center;
  justify-content: center;
  top: 8px;
}
.voice-toggle:hover, .pointer {
    cursor: pointer;
}
.voice-toggle::before {
  content: " ";
  display: block;
  width:24px;
  height:24px;
  margin: 8px;
  position: relative;
  cursor: pointer;
}
.voice-toggle.on::before {
  background-image: url(/public/assets/volume-on.svg);
  background-repeat: no-repeat;
}
.voice-toggle.off::before {
  background-image: url(/public/assets/volume-off.svg);
  background-repeat: no-repeat;
}
.voice-toggle:disabled, .voice-toggle:disabled::before {
  opacity: 0.75;
  cursor: not-allowed;
}
.btn-connect {
  cursor: pointer;
  text-decoration: underline;
}
@-webkit-keyframes loader {
  0% {
    opacity: 0.1;
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0.1;
  }
}
@keyframes loader {
  0% {
    opacity: 0.1;
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0.1;
  }
}
@media only screen and (max-width: 1024px) {
  .hide {
    display: none;
  }
  .voice-toggle{
      display: block;
      height:48px;
      margin: 0px;
      margin-left: 52px;
      background-color: #fff;
      border-radius: 8px;
      top: 0;
    }
  .voice-toggle::before{
      background-position: center;
      width: 100%;
      height: 100%;
      margin: 0;
    }
  .col-1 {
    width: 100%;
    height: 80px;
    margin: 0;
    margin-top: 49px;
    border-radius: 0;
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: flex-start;
    gap: 0px;
    position: absolute;
  }
  .options {
    border: none;
    padding-left:0;
    padding-right:0;
    margin-bottom:0;
    width: 128px;
    margin: 0;
  }
  .col-2 {
    width: 100%;
    height: calc(100% - 128px);
    margin-top: auto;
  }
  .derp {
    width: 48px;
    height: 48px;
    margin: 8px;
    margin-right: 64px;
  }
  div.ascii {
    width: 280px;
  }
  div.content {
    text-align: left;
    margin: auto;
    width: 90vw;
    max-width: 1280px;
    background-color: #E9E7D8;
    border: 3px solid #000000;
    position: relative;
    height: calc(100% - 64px);
    border-radius: 16px;
    overflow: scroll;
    margin-top: 32px;
    margin-bottom: 32px;
    display: flex;
    flex-direction: column;
  }
  .chat-log {
    margin-top:16px;
    height: calc(100% - 158px);
  }
  h1 {
    font-size: 1.2rem;
    margin: 16px;
    flex-grow: 1;
  }
  .v-flex {
    display: none;
  }
}
@media only screen and (max-width: 375px) {
  .logo{
    width:88px;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }   

}
code[class*="language-"],
pre[class*="language-"] {
	color: black;
	background: none;
	font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
	font-size: 1em;
	text-align: left;
	white-space: pre;
	word-spacing: normal;
	word-break: normal;
	word-wrap: normal;
	line-height: 1.5;

	-moz-tab-size: 4;
	-o-tab-size: 4;
	tab-size: 4;

	-webkit-hyphens: none;
	-moz-hyphens: none;
	-ms-hyphens: none;
	hyphens: none;
}

pre[class*="language-"]::-moz-selection, pre[class*="language-"] ::-moz-selection,
code[class*="language-"]::-moz-selection, code[class*="language-"] ::-moz-selection {
	text-shadow: none;
	background: #b3d4fc;
}

pre[class*="language-"]::selection, pre[class*="language-"] ::selection,
code[class*="language-"]::selection, code[class*="language-"] ::selection {
	text-shadow: none;
	background: #b3d4fc;
}

@media print {
	code[class*="language-"],
	pre[class*="language-"] {
		text-shadow: none;
	}
}

/* Code blocks */
pre[class*="language-"] {
	padding: 1em;
	margin: .5em 0;
	overflow: auto;
}

:not(pre) > code[class*="language-"],
pre[class*="language-"] {
	background: #f5f2f0;
}

/* Inline code */
:not(pre) > code[class*="language-"] {
	padding: .1em;
	border-radius: .3em;
	white-space: normal;
}
</style>
