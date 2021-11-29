const label = require('./label');
const { isCommitter } = require('./coreCommitters');
const { translate } = require('./translator');
const { removeHTMLComment } = require('./util');

class Issue {
    constructor(context) {
        this.context = context;
        this.issue = context.payload.issue;
        this.title = this.issue.title;
        this.body = this.issue.body;
        // null -> failed to translate -> unknown language
        // false -> translated -> not in English
        this.translatedTitle = null;
        this.translatedBody = null;
        this.addLabels = [];
        this.removeLabel = null;
    }

    async init () {
        // if author is committer, do not check if using template
        const isCore = isCommitter(this.issue.author_association, this.issue.user.login);

        if (!isCore) {
            this.addLabels.push(label.PENDING);
            this.addLabels.push(label.WAITING_FOR_COMMUNITY);
        }

        // translate issue
        await this._translate();

        const isInEnglish = (!this.translatedTitle && !this.translatedBody)
            || (!this.title.trim() && !this.translatedBody)
            || (!this.body.trim() && !this.translatedTitle);
        if (isInEnglish) {
            this.addLabels.push(label.EN);
        }
    }

    async _translate () {
        let res = await translate(this.title);
        if (res) {
            this.translatedTitle = res.lang !== 'en' && [res.translated, res.lang];
        }
        res = await translate(removeHTMLComment(this.body));
        if (res) {
            this.translatedBody = res.lang !== 'en' && [res.translated, res.lang];
        }
    }
}

module.exports = Issue;
