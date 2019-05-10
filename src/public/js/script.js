Vue.component('question-autocomplete', {
  template: `
    <div :style="{ position: 'relative' }">
      <slot></slot>
      <div class="dropdown-menu" :style="style">
        <a v-for="(item, index) in items" class="dropdown-item" :class="{active: current === index}" :href="'/tickets/update/' + item.id">
          {{ item.question }}
        </a>
      </div>
    </div>
  `,
  data: function () {
    return {
      display: false,
      current: 0,
      items: []
    }
  },
  mounted: function () {
    let input = this.$slots.default[0].elm;
    input.addEventListener('keyup', event => {
      console.log(event.keyCode)
      switch (event.keyCode) {
        case 40: // arrow down
          this.current++;
          if (this.current > this.items.length - 1) {
            this.current = 0;
          }
          break;
        case 38: // arrow up
          this.current--;
          if (this.current < 0) {
            this.current = this.items.length - 1;
          }
          break;
        case 13: // enter
          // do nothing
          break;
        default:
          this.search(event.target.value);
      }
    });
    input.addEventListener('keydown', event => {
      if (event.keyCode === 13) { // enter
        if (this.current !== null) {
          window.location = '/tickets/update/' + this.items[this.current].id;
          event.preventDefault();
        }
      }
    })
    window.addEventListener('click', e => {
      this.display = false;
      this.current = null;
    })
  },
  computed: {
    style: function () {
      if (this.display) {
        return {
          display: 'block',
        };
      }
      return {};
    }
  },
  methods: {
    search(query) {
      fetch('/tickets/search?q=' + query)
        .then(response => response.json())
        .then(json => {
          this.items = json;
          this.display = this.items.length > 0;
          this.current = this.display ? 0 : null;
        });
    }
  }
});
const app = new Vue({
  el: '#app',
  mounted() {
  }
});
