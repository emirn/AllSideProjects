
import Link from 'next/link';
import fetch from 'isomorphic-unfetch';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Scroller from '../components/Scroller';

import * as gtag from '../lib/gtag'

const Index = (props) => (
<div>
<Header/>
<Scroller items={props.data} url={props.baseUrl} filter={props.filter} id={props.id}  alltags={props.alltags}/>
<Footer/>
</div>
)

Index.getInitialProps = async function({ req }) {
  const baseUrl = req ? `${req.protocol}://${req.get('Host')}` : '';
  var res;
  if (typeof req === 'undefined') {
    return __NEXT_DATA__.props;
  }

  if(req.params.id){
    res = await fetch(baseUrl + '/data?id=' + req.params.id);
  }
  else if(req.params.filter){
    var q = baseUrl + '/data?size=0&next=20&filter=' + req.params.filter;
    res = await fetch(q);
  }
  else{
    var q = baseUrl + '/data?size=0&next=20';
    res = await fetch(q);
  }
  var alltags = await fetch(baseUrl + '/alltags');
  const data = await res.json();
  var alltagsjson = await alltags.json();
  return {"data" : data, "id": req.params.id, "filter" : req.params.filter, "alltags": alltagsjson, "baseUrl" : baseUrl}
}

export default Index
