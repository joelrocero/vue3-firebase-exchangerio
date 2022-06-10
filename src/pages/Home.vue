<template>
  <div id="exchangerio">
    <exchange-hero
    :onSearch="filterExchanges"
    />
      <exchange-list
      :exchanges="exchanges"
      />
      <exchange-pagination
      :onNextPage="getMoreExchanges"
      :isFetching="isFetchingMoreData"
      :page="currentPage"
      />
  </div>
</template>

<script>


import ExchangeList from '../components/ExchangeList.vue'
import ExchangePagination from '../components/Pagination.vue'
 import ExchangeHero from '../components/Hero.vue'


export default {
  components:{
    ExchangeList,
    ExchangePagination,
    ExchangeHero
  },
  data(){
    return {
      searchExchangeTitle:""
    }
  },
  computed: {
    exchanges() {
      return this.$store.getters["exchange/filterExchanges"](this.searchExchangeTitle);
    },
    isFetchingMoreData(){
      return this.$store.state.exchange.pagination.isFetchingData;
    },
    currentPage(){
      return this.$store.getters["exchange/currentPage"];
    }
  },
  created() {
    this.$store.dispatch("exchange/getExchanges");
  },
  methods:{
    getMoreExchanges({page}){
      this.$store.dispatch("exchange/getMoreExchanges",{page});
    },
    filterExchanges(searchValue){
      this.searchExchangeTitle = searchValue;
    }
  }
}
</script>

