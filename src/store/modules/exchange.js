import { db } from '../../db'
import { getDocs,getDoc,query,where,limit,startAfter,startAt,
    doc,addDoc,collection,Timestamp } from 'firebase/firestore'
import slugify from 'slugify'

const initPagination = () => ({
    itemCount:3,
    lastItem:null,
    paginationHistory:[],
    isFetchingData: false
})

export default {
    namespaced:true,
    state(){
        return {
            items: [],
            item:{},
            pagination:initPagination()
        }
    },
    getters:{
        currentPage(state){
            if(!state.pagination.paginationHistory) { return 1;}
            return state.pagination.paginationHistory.length;
        },
        filterExchanges: state => searchedTitle =>{
            const { items } = state;
            if(!searchedTitle) { return items; }

            const filterExchanges = items.filter(item => {
                return item.title &&
                item.title.toLowerCase().includes(searchedTitle.toLowerCase());
            })

            return filterExchanges;
        }
    },
    actions:{
        async getExchangeBySlug({commit},slug){
            commit('setExchange',{});
            const docQuery = query(
                collection(db,'exchanges'),
                where('slug','==',slug)
            );
            const querySnap = await getDocs(docQuery);
            const exchange = querySnap.docs[0].data();
            exchange.id = querySnap.docs[0].id;
            const userSnap = await getDoc(exchange.user);
            exchange.user = userSnap.data();
            exchange.user.id = userSnap.id;        
            commit('setExchange',exchange);
        },
        async getMoreExchanges({commit,state},{page}){
            let queryData;

            if(state.pagination.isFetchingData) {return;}
            commit("setIsFetchingData",true);
            
            if(page === 'next'){
                queryData = query(
                    collection(db,"exchanges"),
                    startAfter(state.pagination.lastItem),
                    limit(state.pagination.itemCount)
                )
            }else{
                const lastItemIndex = state.pagination.paginationHistory.length - 1;
                const previousItem = state.pagination.paginationHistory[lastItemIndex - 1];

                if(!previousItem){
                    commit("setIsFetchingData",false);
                    return;
                }

                state.pagination.paginationHistory.splice(lastItemIndex,1);
                queryData = query(
                    collection(db,"exchanges"),
                    startAt(previousItem),
                    limit(state.pagination.itemCount)
                )
            }

            const snapShot = await getDocs(queryData);
            commit("setIsFetchingData",false);
            if(snapShot.docs.length === 0){return;}

            const exchanges = snapShot.docs.map(doc => ({id: doc.id,...doc.data()}));
            commit("setExchanges",exchanges);
            commit("setLastItem",snapShot.docs[snapShot.docs.length -1]);

            if(page === "next"){
                commit("setPaginationHistory",snapShot.docs[0]);
            }
        },
        async getExchanges({commit,state}) {
            commit("resetPagination");

            const exchangeQuery = query(
                collection(db,"exchanges"),
                limit(state.pagination.itemCount)
            );
            
            const snapShot =await getDocs(exchangeQuery);

            const exchanges = snapShot.docs.map(doc => {
                const data = doc.data();  
                const id = doc.id; 
                return {id,...data}; 
            });
            
            commit("setExchanges",exchanges);
            commit("setLastItem",snapShot.docs[snapShot.docs.length -1]);
            commit("setPaginationHistory",snapShot.docs[0]);
        },
        async createExchange({rootState,dispatch},{data,onSuccess}){

            const useRef = doc(db,'users',rootState.user.data.id);
            data.user = useRef;
            data.slug = slugify(`${data.title} ${Date.now()}`,{
                lower:true,
                strict:true
            });
            data.createdAt = Timestamp.fromDate(new Date());

            await addDoc(collection(db,'exchanges'),data);

            dispatch('toast/success','Exchange was created successfuly',{root:true})
            onSuccess();
        }
    },
    mutations : {
        setExchanges(state,exchanges) {
            state.items = exchanges;
        },
        setExchange(state,exchange) {
            state.item = exchange;
        },
        setLastItem(state,item){
            state.pagination.lastItem = item;
        },
        setPaginationHistory(state,item){
            state.pagination.paginationHistory.push(item);
        },
        setIsFetchingData(state,isFetching){
            state.pagination.isFetchingData = isFetching;
        },
        resetPagination(state){
            state.pagination = initPagination();
        }
    }
}