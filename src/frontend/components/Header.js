import Head from 'next/head'

import { GA_TRACKING_ID } from '../lib/gtag'

const Header = () => (
    <Head>
    <title>AllSideProjects - all new side projects and new startups on one page</title>
    
    <meta name="viewport" content="initial-scale=1.0, width=device-width" key="viewport" />
    
    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js" integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossOrigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossOrigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.1/js/bootstrap.min.js" integrity="sha384-smHYKdLADwkXOn1EmN1qk/HfnUcbVRZyYmZ4qpPea6sjB/pTJ0euyQp0Mk8ck+5T" crossOrigin="anonymous"></script>
    
    <link href="https://stackpath.bootstrapcdn.com/bootswatch/4.1.2/yeti/bootstrap.min.css" rel="stylesheet" integrity="sha384-y+fLJ0LEudr90hGVs3z3qJscIwBcKSNqDD1DU3CbG6LeKR5pFk7023EUU2cSRsOa" crossOrigin="anonymous"/>


    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.1.0/css/all.css" integrity="sha384-lKuwvrZot6UHsBSfcMvOkWwlCMgc0TaWr+30HWe3a4ltaBwTZhyTEggF5tJv8tbt" crossOrigin="anonymous"/>
    
    <meta name="viewport" content="width=device-width, initial-scale=1" />


    <link rel='shortcut icon' type='image/x-icon' href='/favicon.ico' />
    
        <style global jsx>{`
              .breakword {
                word-break: break-word;
            }
        `}</style>    
        
          {/* Global Site Tag (gtag.js) - Google Analytics */}
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}}
          />        

    </Head>

)

export default Header
