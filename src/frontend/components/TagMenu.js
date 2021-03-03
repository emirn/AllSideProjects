import Router from 'next/router';


import * as gtag from '../lib/gtag'

export default class TagMenu extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      filter: props.filter,
      scroller : props.scroller,
      alltags : props.scroller.state.alltags,
      count: props.scroller.state.items.length
    };

  }
  async fetchTags(tag){
    var q = "/data?size=0&next=20&filter=" + tag;
    var res = await fetch(q);
    var resp = await res.json();
    this.state.scroller.updateItems(resp, tag);
    this.setState({filter : tag});
  }
  async returnToAllResults(){
    var q= '/data?size=0&next=20';
    var res = await fetch(q);
    var resp = await res.json();
    this.state.scroller.updateItems(resp,null);
    this.setState({filter : null});
  }
  render() {
    return (

    <div className="list-group">
      <div className="list-group-item flex-column">
      <div><h1><a href="/">ALL SIDE PROJECTS</a></h1></div>
      <div className="text-muted small">
      updated daily. 
      version 0.97.
      <a href="https://goo.gl/forms/...."> <i className="fa fa-plus"></i> feedback</a></div>
      <br/>
      {this.state.alltags.map((item, i) => 
          // also trying to filter tags like under $250k+
          (!this.state.filter || (this.state.filter && this.state.filter.indexOf(item)==-1 && item.indexOf('+')==-1)) ? <span><a href={(this.state.filter && this.state.filter.length>0) ? ("/tags/" + this.state.filter + "+" + item) : ("/tags/" + item)} key={"tag" + i} className={item.indexOf('$')>-1 ? "badge badge-pill badge-success" : (item.indexOf(':')>-1 ? "badge badge-pill badge-info" : "badge badge-pill badge-light")}>{item}</a><span> </span></span> : ""
      )}
      
      {!this.state.filter && 
      <div>
        <br/><br/>
        <strong>Popular Shortcuts:</strong>&nbsp;
        <span><a href="/tags/under $10k+$ for sale" className="badge badge-primary"><strong>for sale under $10k</strong></a></span>&nbsp;
        <span><a href="/tags/under $5k+$ for sale" className="badge badge-primary"><strong>for sale under $5k</strong></a></span>&nbsp;
        <span><a href="/tags/under $1k+$ for sale" className="badge badge-primary"><strong>for sale under $1k</strong></a></span>&nbsp;
        <span><a href="/tags/food & drinks+$ for sale" className="badge badge-primary"><strong>food & drinks projects for sale</strong></a></span>&nbsp;
        <span><a href="/tags/game+$ for sale" className="badge badge-primary"><strong>games for sale</strong></a></span>&nbsp;
        <span><a href="/tags/travel+$ for sale" className="badge badge-primary"><strong>travel projects for sale</strong></a></span>&nbsp;
        <span><a href="/tags/ios+$ for sale" className="badge badge-primary"><strong>iOS apps for sale</strong></a></span>&nbsp;        
        <span><a href="/tags/blockchain+$ for sale" className="badge badge-primary"><strong>blockchain projects for sale</strong></a></span>&nbsp;                
        <br/><br/>
      </div>

      }
      
      {this.state.filter && 
        (<div>
        <br/>
        <div><span className=''>filtered by (<a href={"/"} className="small">reset</a>): </span> 
        
        {this.state.filter.split("+").map((item, i) => 
        <span>
          <a href={"/tags/"+this.state.filter.replace("++","+").replace("+" + item,"").replace(item + "+","").replace(item,"")} key={"removeTag" + i} className={item.indexOf('$')>-1 ? "badge badge-pill badge-success" : (item.indexOf(':')>-1 ? "badge badge-pill badge-info" :  "badge badge-pill badge-primary") }>{item} <i className="fa fa-times-circle"></i></a>
          <span> </span>
        </span>
        )}
        <br/>
        <div>bookmark this filter: <div className="addthis_inline_share_toolbox_XXX"></div></div>
        </div>
      </div>)
      }
      </div>
      </div>)
  }
}
