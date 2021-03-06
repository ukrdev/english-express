Vue.component('question-autocomplete', {
  template: `
    <div :style="{ position: 'relative' }">
      <slot></slot>
      <div class="dropdown-menu" :style="style">
        <a v-for="(item, index) in items" class="dropdown-item" :class="{active: current === index}" :href="'/tickets/update/' + item.id">
          {{ item.question }}
          <div>
            <span
              v-for="tagLabel in item.tagLabels"
              class="badge"
              :class="getTagStyle(tagLabel, index)"
              style="margin-right: 4px;"
            >
              {{ tagLabel }}
            </span>
          </div>
        </a>
      </div>
    </div>
  `,
  data: function () {
    return {
      tagsInput: [],
      display: false,
      current: 0,
      items: []
    }
  },
  mounted: function () {
    let input = this.$slots.default[0].elm;
    input.addEventListener('keyup', event => {
      switch (event.keyCode) {
        case 40: // arrow down
          this.nextItem();
          break;
        case 38: // arrow up
          this.prevItem();
          break;
        case 13: // enter
        case 9: // tab
          // do nothing
          break;
        default:
          this.search(event.target.value);
      }
    });
    input.addEventListener('keydown', event => {
      switch (event.keyCode) {
        case 9:
          if (this.display === true) {
            event.preventDefault();
            this.nextItem();
          }
          break;
        case 13:
          if (this.current !== null) {
            window.location = '/tickets/update/' + this.items[this.current].id;
            event.preventDefault();
          }
          break;
      }
    })
    window.addEventListener('click', e => {
      this.display = false;
      this.current = null;
    })

    let tagsInput = document.querySelector('#tags');
    this.tagsInput = tagsInput.value.split(',').map(i => i.trim());
    tagsInput.addEventListener('keyup', e => {
      this.tagsInput = tagsInput.value.split(',').map(i => i.trim());
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
    getTagStyle(label, index) {
      if (this.tagsInput.indexOf(label) !== -1) {
        return {
          'badge-warning': true
        }
      } else if (index === this.current) {
        return {
          'badge-light': true
        }
      } else {
        return {
          'badge-primary': true
        }
      }
    },
    nextItem() {
      this.current++;
      if (this.current > this.items.length - 1) {
        this.current = 0;
      }
    },
    prevItem() {
      this.current--;
      if (this.current < 0) {
        this.current = this.items.length - 1;
      }
    },
    search(query) {
      if (!query) {
        this.items = [];
        this.display = false;
        return;
      }
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
    let el = document.querySelector('[autofocus]');
    if (el) {
      el.focus()
    }
  }
});

window.deleteNote = function (link) {
  const confirmation = confirm('Are you sure?');
  if (!confirmation) {
    return false;
  }

  const url = link.href;

  const form = document.createElement('form');
  form.action = url;
  form.method = 'post';

  const requestMethod = document.createElement('input');
  requestMethod.type = 'hidden';
  requestMethod.name = '_method';
  requestMethod.value = 'DELETE';
  form.append(requestMethod);

  document.body.append(form);

  form.submit();

  return false;
}
