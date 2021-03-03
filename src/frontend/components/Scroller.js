import React from 'react'
import Item from '../components/Item';
import TagMenu from '../components/TagMenu'
import fetch from 'isomorphic-unfetch';
import InfiniteScroll from 'react-infinite-scroll-component';
export default class Scroller extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        items: props.items,
        loadingState: false,
        dataurl: props.url,
        hasMore: true,
        filter: props.filter,
        itemhash: props.id,
        alltags : props.alltags
      };
    }
    
   componentDidMount() {
      window.addEventListener('scroll', this.handleScroll);
    }
  
    componentWillUnmount() {
      window.removeEventListener('scroll', this.handleScroll);
    }
    
    handleScroll = () => {
        // refresh addthis dynamic buttons on scroll
        addthis.layers.refresh();
    };    
    
    fetchMoreData = async () => {
      var q = "";
      
      if(this.state.itemhash)
        q = '/count?id=' + this.state.itemhash;
      else 
        q = '/count?filter=' + this.state.filter;
        
      var res = await fetch(q);
      var count = await res.json();
        if (this.state.items.length >= parseInt(count)) {
            this.setState({
              hasMore: false
            });
            return;
          }
        if (this.state.itemhash)
          q = '/data?size=' + this.state.items.length + '&next=0&id=' + this.state.itemhash;
        else
          q = '/data?size=' + this.state.items.length + '&next=20&filter=' + this.state.filter;
        var res = await fetch(q);
        var resp = await res.json();
        this.setState({
          items: this.state.items.concat(resp)
       });
    };

    updateItems(items, filter){
      this.setState({items: [], filter: null});
      this.setState({items: items, filter : filter, hasMore: true});
      window.scroll(0,0);
    }


    render() {
        return (<div><TagMenu filter={this.state.filter} scroller={this} /> <InfiniteScroll
          dataLength = {
            this.state.items.length
          }
          next = {
            this.fetchMoreData
          }
          hasMore = {
            this.state.hasMore
          }
          loader = {
            <div className="list-group-item flex-column"><span className="text-muted"> loading more items... </span></div>
          }
          endMessage={
            <div className="list-group-item flex-column"><span className="text-muted"> no more items found. <strong><a href="/">click here to reset filter and see all items</a></strong> </span></div>          
          }
          >
                {
                  this.state.items.map((item, i) => <Item item = {item} key={"scrollitem" + i} scroller={this}/>)}
          </InfiniteScroll>
            </div>);
          }

        }
        
