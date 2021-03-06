import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { AllHtmlEntities } from 'html-entities';
import * as sdk from "../../../index";
import { _t } from "../../../languageHandler";

export default class TweetPreviewWidget extends React.Component {
    constructor(props) {
        super(props);
        this.previewRef = React.createRef();
    }

    static propTypes = {
        link: PropTypes.string.isRequired, // the URL being previewed
        onCancelClick: PropTypes.func, // called when the preview's cancel ('hide') button is clicked
    }

    static defaultProps = { oEmbedPayload: null };

    state = {
        oEmbedPayload: null
    };

    jsonpFetch = function(url, callback, timeout) {
        return new Promise((resolve, reject) => {
            let script = document.createElement('script')
            let timeout_trigger = window.setTimeout(() => {
                window[callback] = () => {}
                script.parentNode.removeChild(script)
                reject('No response')
            }, timeout * 1000)

            window[callback] = (data) => {
                window.clearTimeout(timeout_trigger)
                script.parentNode.removeChild(script)
                resolve(data)
            }

            script.type = 'text/javascript'
            script.async = true
            script.src = url

            document.getElementsByTagName('head')[0].appendChild(script)
        })
    };

    componentDidMount() {
        this.unmounted = false;

        const callback = "loadTweet" + Math.round(Math.random() * 99999999);
        this.jsonpFetch("https://publish.twitter.com/oembed?url="+this.props.link+"&callback="+callback+"&dnt=true&omit_script=1&maxwidth=500&limit=3", callback, 5)
            .then((json) => {
                if (!this.unmounted) {
                    this.setState({ oEmbedPayload: json })
                }
            })
            .catch((err) => console.log(err))
    };

    componentDidUpdate() {
        let twitterScript = document.createElement("script");
        twitterScript.src = "https://platform.twitter.com/widgets.js";
        twitterScript.type = 'text/javascript'
        twitterScript.async = true;
        this.previewRef.current.appendChild(twitterScript);
    };

    componentWillUnmount() {
        this.unmounted = true;
    };

    render() {
        const p = this.state.oEmbedPayload;
        if (!p || Object.keys(p).length === 0) {
            return <div />;
        }

        const card = { __html: AllHtmlEntities.decode(p['html'] || "") };
        const AccessibleButton = sdk.getComponent('elements.AccessibleButton');

        return (
            <div className="mx_TweetPreviewWidget" >
                <div className="mx_TweetPreviewWidget_container" dangerouslySetInnerHTML={card} ref={this.previewRef} />
                <AccessibleButton className="mx_TweetPreviewWidget_cancel" onClick={this.props.onCancelClick} aria-label={_t("Close preview")}>
                    <img className="mx_filterFlipColor" alt="" role="presentation"
                        src={require("../../../../res/img/cancel.svg")} width="18" height="18" />
                </AccessibleButton>
            </div>
        );
    };
}
