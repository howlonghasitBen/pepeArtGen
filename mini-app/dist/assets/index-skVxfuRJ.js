import{p as R,q as U,t as P,u as $,C as d,d as E,v as D,R as v,M as N,w as O,Q as V,J as j,i as F,a as b,O as M,y as l,x as T,e as x,E as h,W as f,c as A,r as W,N as w}from"./index-BTeI1L2U.js";import{z as ae,V as re,Y as oe}from"./index-BTeI1L2U.js";const c=R({status:"uninitialized"}),u={state:c,subscribeKey(n,e){return $(c,n,e)},subscribe(n){return P(c,()=>n(c))},_getClient(){if(!c._client)throw new Error("SIWEController client not set");return c._client},async getNonce(n){const t=await this._getClient().getNonce(n);return this.setNonce(t),t},async getSession(){try{const e=await this._getClient().getSession();return e&&(this.setSession(e),this.setStatus("success")),e||void 0}catch{return}},createMessage(n){const t=this._getClient().createMessage(n);return this.setMessage(t),t},async verifyMessage(n){return await this._getClient().verifyMessage(n)},async signIn(){return await this._getClient().signIn()},async signOut(){var e;const n=this._getClient();await n.signOut(),this.setStatus("ready"),this.setSession(void 0),(e=n.onSignOut)==null||e.call(n)},onSignIn(n){var t;const e=this._getClient();(t=e.onSignIn)==null||t.call(e,n)},onSignOut(){var e;const n=this._getClient();(e=n.onSignOut)==null||e.call(n)},async setSIWEClient(n){c._client=U(n),c.session=await this.getSession(),c.status=c.session?"success":"ready"},setNonce(n){c.nonce=n},setStatus(n){c.status=n},setMessage(n){c.message=n},setSession(n){c.session=n,c.status=n?"success":"ready"}},_={FIVE_MINUTES_IN_MS:3e5};class q{constructor(e){const{enabled:t=!0,nonceRefetchIntervalMs:s=_.FIVE_MINUTES_IN_MS,sessionRefetchIntervalMs:i=_.FIVE_MINUTES_IN_MS,signOutOnAccountChange:a=!0,signOutOnDisconnect:r=!0,signOutOnNetworkChange:o=!0,...g}=e;this.options={enabled:t,nonceRefetchIntervalMs:s,sessionRefetchIntervalMs:i,signOutOnDisconnect:r,signOutOnAccountChange:a,signOutOnNetworkChange:o},this.methods=g}async getNonce(e){const t=await this.methods.getNonce(e);if(!t)throw new Error("siweControllerClient:getNonce - nonce is undefined");return t}async getMessageParams(){var e,t;return await((t=(e=this.methods).getMessageParams)==null?void 0:t.call(e))||{}}createMessage(e){const t=this.methods.createMessage(e);if(!t)throw new Error("siweControllerClient:createMessage - message is undefined");return t}async verifyMessage(e){return await this.methods.verifyMessage(e)}async getSession(){const e=await this.methods.getSession();if(!e)throw new Error("siweControllerClient:getSession - session is undefined");return e}async signIn(){var I,y;if(!u.state._client)throw new Error("SIWE client needs to be initialized before calling signIn");const e=d.state.activeCaipAddress,t=e?E.getPlainAddress(e):"",s=await this.methods.getNonce(t);if(!t)throw new Error("An address is required to create a SIWE message.");const i=d.state.activeCaipNetwork;if(!(i!=null&&i.id))throw new Error("A chainId is required to create a SIWE message.");const a=i.id;if(!a)throw new Error("A chainId is required to create a SIWE message.");const r=(I=u.state._client)==null?void 0:I.options.signOutOnNetworkChange;r&&(u.state._client.options.signOutOnNetworkChange=!1,await this.signOut()),r&&(u.state._client.options.signOutOnNetworkChange=!0);const o=await((y=this.getMessageParams)==null?void 0:y.call(this)),g=this.methods.createMessage({address:e,chainId:Number(a),nonce:s,version:"1",iat:(o==null?void 0:o.iat)||new Date().toISOString(),...o});D.getConnectedConnector()==="ID_AUTH"&&v.pushTransactionStack({view:null,goBack:!1,replace:!0,onSuccess(){N.close()}});const k=await O.signMessage(g);if(!await this.methods.verifyMessage({message:g,signature:k}))throw new Error("Error verifying SIWE signature");const m=await this.methods.getSession();if(!m)throw new Error("Error verifying SIWE signature");return this.methods.onSignIn&&this.methods.onSignIn(m),m}async signOut(){var e,t;return(t=(e=this.methods).onSignOut)==null||t.call(e),this.methods.signOut()}}const z=/0x[a-fA-F0-9]{40}/u,H=/Chain ID: (?<temp1>\d+)/u;function G(n){var e;return((e=n.match(z))==null?void 0:e[0])||""}function J(n){var e;return`eip155:${((e=n.match(H))==null?void 0:e[1])||1}`}async function Q({address:n,message:e,signature:t,chainId:s,projectId:i}){let a=V(n,e,t);return a||(a=await j(n,e,t,s,i)),a}const K=F`
  :host {
    display: flex;
    justify-content: center;
    gap: var(--wui-spacing-2xl);
  }

  wui-visual-thumbnail:nth-child(1) {
    z-index: 1;
  }
`;var X=function(n,e,t,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,t):s,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,s);else for(var o=n.length-1;o>=0;o--)(r=n[o])&&(a=(i<3?r(a):i>3?r(e,t,a):r(e,t))||a);return i>3&&a&&Object.defineProperty(e,t,a),a};let S=class extends b{constructor(){var e,t;super(...arguments),this.dappImageUrl=(e=M.state.metadata)==null?void 0:e.icons,this.walletImageUrl=(t=l.state.connectedWalletInfo)==null?void 0:t.icon}firstUpdated(){var t;const e=(t=this.shadowRoot)==null?void 0:t.querySelectorAll("wui-visual-thumbnail");e!=null&&e[0]&&this.createAnimation(e[0],"translate(18px)"),e!=null&&e[1]&&this.createAnimation(e[1],"translate(-18px)")}render(){var e;return T`
      <wui-visual-thumbnail
        ?borderRadiusFull=${!0}
        .imageSrc=${(e=this.dappImageUrl)==null?void 0:e[0]}
      ></wui-visual-thumbnail>
      <wui-visual-thumbnail .imageSrc=${this.walletImageUrl}></wui-visual-thumbnail>
    `}createAnimation(e,t){e.animate([{transform:"translateX(0px)"},{transform:t}],{duration:1600,easing:"cubic-bezier(0.56, 0, 0.48, 1)",direction:"alternate",iterations:1/0})}};S.styles=K;S=X([x("w3m-connecting-siwe")],S);var C=function(n,e,t,s){var i=arguments.length,a=i<3?e:s===null?s=Object.getOwnPropertyDescriptor(e,t):s,r;if(typeof Reflect=="object"&&typeof Reflect.decorate=="function")a=Reflect.decorate(n,e,t,s);else for(var o=n.length-1;o>=0;o--)(r=n[o])&&(a=(i<3?r(a):i>3?r(e,t,a):r(e,t))||a);return i>3&&a&&Object.defineProperty(e,t,a),a};let p=class extends b{constructor(){var e;super(...arguments),this.dappName=(e=M.state.metadata)==null?void 0:e.name,this.isSigning=!1,this.isCancelling=!1}render(){return T`
      <wui-flex justifyContent="center" .padding=${["2xl","0","xxl","0"]}>
        <w3m-connecting-siwe></w3m-connecting-siwe>
      </wui-flex>
      <wui-flex
        .padding=${["0","4xl","l","4xl"]}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="paragraph-500" align="center" color="fg-100"
          >${this.dappName??"Dapp"} needs to connect to your wallet</wui-text
        >
      </wui-flex>
      <wui-flex
        .padding=${["0","3xl","l","3xl"]}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="small-400" align="center" color="fg-200"
          >Sign this message to prove you own this wallet and proceed. Canceling will disconnect
          you.</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${["l","xl","xl","xl"]} gap="s" justifyContent="space-between">
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral"
          ?loading=${this.isCancelling}
          @click=${this.onCancel.bind(this)}
          data-testid="w3m-connecting-siwe-cancel"
        >
          Cancel
        </wui-button>
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="main"
          @click=${this.onSign.bind(this)}
          ?loading=${this.isSigning}
          data-testid="w3m-connecting-siwe-sign"
        >
          ${this.isSigning?"Signing...":"Sign"}
        </wui-button>
      </wui-flex>
    `}async onSign(){var e,t,s;this.isSigning=!0,h.sendEvent({event:"CLICK_SIGN_SIWX_MESSAGE",type:"track",properties:{network:((e=d.state.activeCaipNetwork)==null?void 0:e.caipNetworkId)||"",isSmartAccount:l.state.preferredAccountType===f.ACCOUNT_TYPES.SMART_ACCOUNT}});try{u.setStatus("loading");const i=await u.signIn();return u.setStatus("success"),h.sendEvent({event:"SIWX_AUTH_SUCCESS",type:"track",properties:{network:((t=d.state.activeCaipNetwork)==null?void 0:t.caipNetworkId)||"",isSmartAccount:l.state.preferredAccountType===f.ACCOUNT_TYPES.SMART_ACCOUNT}}),i}catch{const r=l.state.preferredAccountType===f.ACCOUNT_TYPES.SMART_ACCOUNT;return r?A.showError("This application might not support Smart Accounts"):A.showError("Signature declined"),u.setStatus("error"),h.sendEvent({event:"SIWX_AUTH_ERROR",type:"track",properties:{network:((s=d.state.activeCaipNetwork)==null?void 0:s.caipNetworkId)||"",isSmartAccount:r}})}finally{this.isSigning=!1}}async onCancel(){var t;this.isCancelling=!0,d.state.activeCaipAddress?(await O.disconnect(),N.close()):v.push("Connect"),this.isCancelling=!1,h.sendEvent({event:"CLICK_CANCEL_SIWX",type:"track",properties:{network:((t=d.state.activeCaipNetwork)==null?void 0:t.caipNetworkId)||"",isSmartAccount:l.state.preferredAccountType===f.ACCOUNT_TYPES.SMART_ACCOUNT}})}};C([W()],p.prototype,"isSigning",void 0);C([W()],p.prototype,"isCancelling",void 0);p=C([x("w3m-connecting-siwe-view")],p);function te(n){return d.subscribeKey("activeCaipNetwork",async e=>{if(!n.options.signOutOnNetworkChange)return;const t=await n.methods.getSession().catch(()=>{});t&&t.chainId!==w.caipNetworkIdToNumber(e==null?void 0:e.caipNetworkId)&&await n.methods.signOut()}),d.subscribeKey("activeCaipAddress",async e=>{if(!n.options.signOutOnAccountChange)return;const t=await n.methods.getSession().catch(()=>{});t&&t.address!==E.getPlainAddress(e)&&await n.methods.signOut()}),{async createMessage(e){var r,o;const t=await((o=(r=n.methods).getMessageParams)==null?void 0:o.call(r));if(!t)throw new Error("Failed to get message params!");const s=await n.getNonce(e.accountAddress),i=t.iat||new Date().toISOString(),a="1";return{nonce:s,version:a,requestId:t.requestId,accountAddress:e.accountAddress,chainId:e.chainId,domain:t.domain,uri:t.uri,notBefore:t.nbf,resources:t.resources,statement:t.statement,expirationTime:t.exp,issuedAt:i,toString:()=>n.createMessage({...t,chainId:w.caipNetworkIdToNumber(e.chainId)||1,address:`did:pkh:${e.chainId}:${e.accountAddress}`,nonce:s,version:a,iat:i})}},async addSession(e){var s,i;if(!w.parseEvmChainId(e.data.chainId))return Promise.resolve();if(await n.methods.verifyMessage(e))return(i=(s=n.methods).onSignIn)==null||i.call(s,{address:e.data.accountAddress,chainId:w.parseEvmChainId(e.data.chainId)}),Promise.resolve();throw new Error("Failed to add session")},async revokeSession(e,t){var s,i;if(await n.signOut())return(i=(s=n.methods).onSignOut)==null||i.call(s),Promise.resolve();throw new Error("Failed to sign out")},async setSessions(e){if(e.length===0)await n.methods.signOut();else{const t=e.map(s=>this.addSession(s));await Promise.all(t)}},async getSessions(e,t){try{if(!e.startsWith("eip155:"))return[{data:{accountAddress:t,chainId:e},message:"",signature:""}];const s=await n.methods.getSession(),i=`eip155:${s==null?void 0:s.chainId}`;return!s||s.address!==t||i!==e?[]:[{data:{accountAddress:s.address,chainId:i},message:"",signature:""}]}catch(s){return console.error("SIWE:getSessions - error:",s),[]}}}}function ne(n){return new q(n)}export{u as SIWEController,S as W3mConnectingSiwe,p as W3mConnectingSiweView,ne as createSIWEConfig,ae as formatMessage,G as getAddressFromMessage,J as getChainIdFromMessage,re as getDidAddress,oe as getDidChainId,te as mapToSIWX,Q as verifySignature};
