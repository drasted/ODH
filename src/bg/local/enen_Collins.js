if (typeof enen_Collins == 'undefined') {

    class enen_Collins {
        constructor(options) {
            this.options = options;
            this.maxexample = options.maxexample;
            this.word = '';
            this.base = 'https://www.collinsdictionary.com/dictionary/english/'

        }

        resourceURL(word) {
            return this.base + encodeURIComponent(word);
        }

        async findTerm(word) {
            this.word = word;
            //let deflection = formhelper.deinflect(word);
            let results = await Promise.all([this.findCollins(word)]);
            return [].concat(...results);
        }

        async onlineQuery(url) {
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: url,
                    type: "GET",
                    timeout: 5000,
                    error: (xhr, status, error) => {
                        reject(error);
                    },
                    success: (data, status) => {
                        if (data) {
                            resolve(data);
                        } else {
                            reject(new Error('Not Found!'));
                        }
                    }
                });
            });
        }

        async findCollins(word) {
            let notes = [];
            if (!word) return notes; // return empty notes

            function T(node) {
                if (!node)
                    return '';
                else
                    return node.innerText.trim();
            }

            let url = this.resourceURL(word);
            let data = await this.onlineQuery(url);

            let parser = new DOMParser(),
                doc = parser.parseFromString(data, "text/html");

            let dictionary = doc.querySelector('.dictionary.Cob_Adv_Brit');
            if (!dictionary) return notes; // return empty notes

            let expression = T(dictionary.querySelector('.h2_entry'));
            let reading = T(dictionary.querySelector('.pron'));

            let band = dictionary.querySelector('.word-frequency-img');
            let bandnum = band ? band.dataset.band : '';
            let extrainfo = bandnum ? `<span class="band">${'\u25CF'.repeat(Number(bandnum))}</span>` : '';

            let sound = dictionary.querySelector('a.hwd_sound');
            let audios = sound ? [sound.dataset.srcMp3] : [];
            // make definition segement
            let definitions = [];
            let defblocks = dictionary.querySelectorAll('.hom') || [];
            for (const defblock of defblocks) {
                let pos = T(defblock.querySelector('.pos'));
                pos = pos ? `<span class="pos">${pos}</span>` : '';
                let eng_tran = T(defblock.querySelector('.sense .def'));
                if (!eng_tran) continue;
                let definition = '';
                eng_tran = `<span class='eng_tran'>${eng_tran}</span>`;
                let tran = `<span class='tran'>${eng_tran}</span>`;
                definition += `${pos}${tran}`;

                // make exmaple segement
                let examps = defblock.querySelectorAll('.sense .cit.type-example') || '';
                if (examps.length > 0 && this.maxexample > 0) {
                    definition += '<ul class="sents">';
                    for (const [index, examp] of examps.entries()) {
                        if (index > this.maxexample - 1) break; // to control only 2 example sentence.
                        definition += T(examp) ? `<li class='sent'><span class='eng_sent'>${T(examp)}</span></li>` : '';
                    }
                    definition += '</ul>';
                }
                definitions.push(definition);
            }
            let css = this.renderCSS();
            notes.push({
                css,
                expression,
                reading,
                extrainfo,
                definitions,
                audios,
            });
            return notes;
        }

        renderCSS() {
            let css = `
            <style>
                span.band {color:#e52920;}
                span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                span.tran {margin:0; padding:0;}
                span.eng_tran {margin-right:3px; padding:0;}
                span.chn_tran {color:#0d47a1;}
                ul.sents {font-size:0.9em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                li.sent  {margin:0; padding:0;}
                span.eng_sent {margin-right:5px;}
                span.chn_sent {color:#0d47a1;}
            </style>`;
            return css;
        }
    }

    registerDict('enen_Collins', enen_Collins);

}