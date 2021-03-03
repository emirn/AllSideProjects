import fetch from 'isomorphic-unfetch';
import Router from 'next/router';
export default class Item extends React.Component{
  constructor(props) {
     super(props);
     this.state = {
        item: props.item,
        scroller: props.scroller
      };
    }

    render() {
      return (
        <div key={this.state.item._id}  className=" list-group-item flex-column align-items-start">
                  <div className="d-flex w-100 justify-content-between">
                    <div className="breakword flex-column">
                      <h2 className="mb-1">
                        <a target="_blank" href={(this.state.item.url && this.state.item.url !== "") ? this.state.item.url : this.state.item.urlSource}>{this.state.item.title}</a>
                      </h2>
                      
                      <div className="addthis_inline_share_toolbox_XXXXX" data-url={"/id/" + this.state.item.hash.toString()} data-title={this.state.item.title.slice(0,60) + (this.state.item.price > 0 ? " (price: $" + this.state.item.price.toLocaleString('en-US', { maximumSignificantDigits: 3 }) + ")" : "") +" - AllSideProjects.com"}/>

                      <span className="mb-1 text-danger">
                      {
                        this.state.item.saleType == 3 ?
                        (
                        <span>
                          <span className="badge badge-warning">SOLD</span>
                          &nbsp;
                          { this.state.item.price > 0 && (<del>{"$" + (parseFloat(this.state.item.price)).toLocaleString()}</del>) }
                        </span>
                        ) 
                        :
                        (
                        <span>
                          {this.state.item.price > 0 && <span>{"$" + (parseFloat(this.state.item.price)).toLocaleString()}</span>}
                        </span>
                        )

                      } 
                        
                      &nbsp;
                      </span>
                      <a target="_blank" className="breakword small" href={this.state.item.url ? this.state.item.url : this.state.item.urlSource }>{(this.state.item.url && this.state.item.url.match(/^(https?\:\/\/)*([^\/:?#]+)(?:[\/:?#]|$)/i)) ? this.state.item.url.match(/^(https?\:\/\/)*([^\/:?#]+)(?:[\/:?#]|$)/i)[2].replace('www.','') : this.state.item.urlSource.match(/^(https?\:\/\/)*([^\/:?#]+)(?:[\/:?#]|$)/i)[2].replace('www.','')}</a>
                      &nbsp; <a target="_blank" href={this.state.item.siteUrl} className="small text-success">{(this.state.item.price && this.state.item.price >0) ? "contact" : "source"}</a>

                      {this.state.item.urlStat && 
                        <span>
                          &nbsp;&nbsp;<a target="_blank" title="check traffic via Similarweb" className="text-muted" href={this.state.item.urlStat}><small><i className="fa fa-chart-bar text-warning"></i></small></a>
                        </span>
                      }

                      &nbsp; <small className="text-muted">{this.state.item.timeCreatedAgo}</small>
                      
                    </div>
                  </div>
                  

                  {this.state.item.contentTags.map((tag, i) =>
                    <span>
                      <a key={"itemtag" + i} href={"/tags/" + tag} className={tag.indexOf('$')>-1 ? "badge badge-pill badge-success" : (tag.indexOf(':')>-1 ? "badge badge-pill badge-info" : "badge badge-pill badge-light")}>{tag}</a>
                      <span> </span>
                    </span>
                  )}
                  <br/><br/>
                  <p className="breakword">{this.state.item.description ? this.state.item.description : "no description"}</p>
        </div>)
    }

}
