<template>
  <div class="content">
    <!-- Chat Log -->
    <div class="chat-log">
      <div class="chat-item" v-for="(chatEntry, i) in chatLog" :key="'chat-item-'+i">
        <p 
          :class="{
            you: chatEntry.speaker == 'You', 
            bot: chatEntry.speaker !== 'You', 
            author: true
          }" 
          v-if="chatEntry.speaker"
        >{{chatEntry.speaker}}<span v-if="chatEntry.style">&nbsp;({{chatEntry.style}})</span>:</p>
        <p 
          :class="{
            message: true, 
            info: !chatEntry.speaker
          }" 
          v-if="chatEntry.message"
        >{{chatEntry.message}}</p>
      </div>
      <div class="loading" v-if="loading"></div>
    </div>
    
    <!-- Chat Input -->
    <div class="chat-input">
      <select class="form-control question item" v-model="voices.selected">
        <option v-for="(voice, i) in voices.options" :key="'voice-'+i" :value="voice.value">{{voice.name}}</option>
      </select>
      <input 
        placeholder="Ask Derpie a question" 
        class="form-control" 
        type="text" 
        name="question" 
        v-model="question" 
      />
      <button class="btn btn-primary" @click="ask()">Submit</button>
    </div>
  </div>
</template>

<script>
import * as api from './util/api';

const VOICE_DEFAULT = 0;
const VOICE_SASSY = 1;
const VOICE_NERDY = 2;
const VOICE_DELUSIONAL = 3;

const VOICES = [VOICE_DEFAULT, VOICE_SASSY, VOICE_NERDY, VOICE_DELUSIONAL];

export default {
  name: 'Derpies Assistant',
  data: () => ({
    api: api,
    voices: {
      options: [
        {value: VOICE_DEFAULT, name: "Default"},
        {value: VOICE_SASSY, name: "Sassy"},
        {value: VOICE_NERDY, name: "Nerdy"},
        {value: VOICE_DELUSIONAL, name: "Delusional"},
      ],
      list: VOICES,
      selected: VOICE_DEFAULT
    },
    chatLog: [],
    question: null,
    loading: false
  }),
  mounted: async function () {
    this.chatLog.push(
      {message: "Derpie has entered the chat"},
      {message: "You entered the chat"},
    );
  },
  methods: {
    ask: async function () {
      this.loading = true;
      // console.log("question", this.question);
      if (!this.question) return;
      let question = JSON.stringify(this.question);
      this.question = null;
      if (this.voices.list.indexOf(this.voices.selected) == -1) this.voices.selected = VOICE_DEFAULT;
      let req = {
        question: JSON.parse(question), 
        voice: this.voices.selected
      };
      let resp = await this.api.request.post('/', req);
      // console.log('resp', resp);
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
          message: d.chat
        };
        this.chatLog.push(userChatEntry, apiChatEntry);
        this.loading = false;
      } else {
        this.loading = false;
      }
    }
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
div.content {
  text-align: left;
  margin: auto;
  margin-top: 3em;
  width: 90vw;
  max-width: 1280px;
}
div.loading {
  border-radius: 50%;
  width: 60px;
  height: 60px;
  border: 8px solid #f3f3f3;
  border-top: 8px solid #000000;
  animation: loader 2s linear infinite;
  margin: auto;
}
.chat-log, .chat-input {
  padding: 1.5em;
  border-radius: 4px;
}
.chat-log {
  background-color: #f9f9f9;
}
p.info {
  color: orange;
}
p.author {
  font-weight: bold;
}
p.author.bot {
  color: violet;
}
p.author.you {
  color: blue;
}
p.author.bot span, p.info {
  font-style: italic;
}

@keyframes loader {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
