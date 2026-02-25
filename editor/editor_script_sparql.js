// SPARQLエンドポイント
const SPARQL_ENDPOINT = 'https://dydra.com/junjun7613/inscriptions_llm/sparql';

// グローバル変数
let allInscriptions = [];
let currentIndex = 0;
let personIdCounter = 0;
let communityIdCounter = 0;

// 関係性プロパティの定義
const relationshipProperties = {
    family: ["father", "mother", "son", "daughter", "brother", "sister", "spouse", "husband", "wife", "grandfather", "grandmother", "grandson", "granddaughter", "uncle", "aunt", "nephew", "niece", "cousin"],
    colleague: ["co-officer", "fellow-soldier", "colleague", "associate"],
    patronage: ["patron", "client", "freedman", "freedwoman", "former-owner"],
    dedication: ["dedicator", "dedicatee", "honored-person", "person-who-erected"],
    economic: ["buyer", "seller", "debtor", "creditor", "business-partner", "tenant", "landlord", "contractor", "employer", "employee"],
    affiliation: ["member", "soldier", "decurion", "citizen", "resident", "officer", "priest"]
};

// データ構造
let data = {
    edcs_id: '',
    persons: [],
    communities: [],
    person_relationships: [],
    notes: ''
};

// ファイル選択
document.getElementById('fileInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                allInscriptions = JSON.parse(event.target.result);
                currentIndex = 0;
                loadInscription(currentIndex);
                showStatus('JSONファイルを読み込みました', true);
            } catch (error) {
                showStatus('JSON解析エラー: ' + error.message, false);
            }
        };
        reader.readAsText(file);
    }
});

// ページネーション更新
function updatePagination() {
    const pageInfo = document.getElementById('pageInfo');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if (allInscriptions.length > 0) {
        pageInfo.textContent = `${currentIndex + 1} / ${allInscriptions.length}`;
        btnPrev.disabled = currentIndex === 0;
        btnNext.disabled = currentIndex === allInscriptions.length - 1;
    }
}

// 前の碑文へ
function previousInscription() {
    if (currentIndex > 0) {
        saveCurrentInscriptionData();
        currentIndex--;
        loadInscription(currentIndex);
    }
}

// 次の碑文へ
function nextInscription() {
    if (currentIndex < allInscriptions.length - 1) {
        saveCurrentInscriptionData();
        currentIndex++;
        loadInscription(currentIndex);
    }
}

// 現在の碑文データを保存
function saveCurrentInscriptionData() {
    data.notes = document.getElementById('notes').value;
    if (allInscriptions.length > 0 && currentIndex < allInscriptions.length) {
        allInscriptions[currentIndex].gold_standard = JSON.parse(JSON.stringify(data));
    }
}

// 碑文データをロード
async function loadInscription(index) {
    if (index < 0 || index >= allInscriptions.length) return;

    const inscription = allInscriptions[index];
    const edcsId = inscription['EDCS-ID'] || '';

    // 碑文情報を表示
    document.getElementById('edcsId').textContent = edcsId || '-';
    document.getElementById('place').textContent = inscription.place || '-';

    let dating = '-';
    if (inscription.dating_from || inscription.dating_to) {
        dating = `${inscription.dating_from || '?'} ~ ${inscription.dating_to || '?'}`;
    } else if (inscription.date_not_before || inscription.date_not_after) {
        dating = `${inscription.date_not_before || '?'} ~ ${inscription.date_not_after || '?'}`;
    }
    document.getElementById('dating').textContent = dating;
    document.getElementById('inscriptionText').textContent = inscription.inscription || '碑文テキストなし';

    // SPARQLからRDFデータを取得
    if (edcsId) {
        showStatus('SPARQLエンドポイントからデータを取得中...', true, 'info');
        try {
            const rdfData = await fetchRDFData(edcsId);

            // RDFデータがあれば初期値として使用
            if (rdfData && rdfData.persons && rdfData.persons.length > 0) {
                data = rdfData;
                document.getElementById('dataSource').textContent = 'SPARQL + filtered_data';
                showStatus(`EDCS-ID ${edcsId} のRDFデータを読み込みました`, true);
            } else {
                // RDFデータがない場合は空の構造を初期化
                data = {
                    edcs_id: edcsId,
                    persons: [],
                    communities: [],
                    person_relationships: [],
                    notes: ''
                };
                document.getElementById('dataSource').textContent = 'filtered_data のみ';
                showStatus('RDFデータが見つかりませんでした。新規作成します。', true, 'info');
            }
        } catch (error) {
            console.error('SPARQL取得エラー:', error);
            data = {
                edcs_id: edcsId,
                persons: [],
                communities: [],
                person_relationships: [],
                notes: ''
            };
            document.getElementById('dataSource').textContent = 'filtered_data のみ (SPARQLエラー)';
            showStatus('SPARQL取得エラー: ' + error.message, false);
        }
    } else {
        data = {
            edcs_id: '',
            persons: [],
            communities: [],
            person_relationships: [],
            notes: ''
        };
        document.getElementById('dataSource').textContent = 'filtered_data のみ';
    }

    // カウンターを更新
    personIdCounter = data.persons.length > 0 ? Math.max(...data.persons.map(p => p.person_id), -1) + 1 : 0;
    communityIdCounter = data.communities.length > 0 ? Math.max(...data.communities.map(c => c.community_id), -1) + 1 : 0;

    // 備考
    document.getElementById('notes').value = data.notes || '';

    // レンダリング
    renderPersons();
    renderCommunities();
    renderRelationships();

    // ページネーション更新
    updatePagination();
}

// SPARQLクエリでRDFデータを取得
async function fetchRDFData(edcsId) {
    const query = `
PREFIX base: <http://example.org/inscription/>
PREFIX epig: <http://example.org/epigraphy/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT
    ?person ?person_label ?person_name ?normalized_name
    ?praenomen ?nomen ?cognomen
    ?social_status ?gender ?ethnicity
    ?age_at_death
    ?career_position ?position_name ?position_type ?position_order
    ?position_normalized ?position_abstract
    ?benefaction ?benef_type ?benef_object ?benef_cost
    ?community ?community_name ?community_type
    ?relationship ?rel_type ?rel_property ?rel_source ?rel_target
WHERE {
    ?inscription a epig:Inscription ;
                 dcterms:identifier "${edcsId}" .

    OPTIONAL {
        ?inscription epig:mentions ?person .
        ?person a foaf:Person .

        OPTIONAL { ?person rdfs:label ?person_label . }
        OPTIONAL { ?person foaf:name ?person_name . }
        OPTIONAL { ?person epig:normalizedName ?normalized_name . }

        OPTIONAL {
            ?person epig:praenomen ?praenomen_uri .
            ?praenomen_uri rdfs:label ?praenomen .
        }
        OPTIONAL {
            ?person epig:nomen ?nomen_uri .
            ?nomen_uri rdfs:label ?nomen .
        }
        OPTIONAL {
            ?person epig:cognomen ?cognomen_uri .
            ?cognomen_uri rdfs:label ?cognomen .
        }

        OPTIONAL {
            ?person epig:socialStatus ?social_status_uri .
            ?social_status_uri rdfs:label ?social_status .
        }
        OPTIONAL { ?person foaf:gender ?gender . }
        OPTIONAL { ?person epig:ethnicity ?ethnicity . }
        OPTIONAL { ?person epig:ageAtDeath ?age_at_death . }

        OPTIONAL {
            ?person epig:hasCareerPosition ?career_position .
            OPTIONAL { ?career_position epig:positionName ?position_name . }
            OPTIONAL { ?career_position epig:positionType ?position_type_uri .
                      ?position_type_uri rdfs:label ?position_type . }
            OPTIONAL { ?career_position epig:positionOrder ?position_order . }
            OPTIONAL { ?career_position epig:positionNormalized ?position_normalized . }
            OPTIONAL { ?career_position epig:positionAbstract ?position_abstract . }
        }

        OPTIONAL {
            ?person epig:hasBenefaction ?benefaction .
            OPTIONAL { ?benefaction epig:benefactionType ?benef_type . }
            OPTIONAL { ?benefaction epig:object ?benef_object . }
            OPTIONAL { ?benefaction epig:benefactionCost ?benef_cost . }
        }
    }

    OPTIONAL {
        ?inscription epig:mentions ?community .
        ?community a epig:Community .
        OPTIONAL { ?community epig:communityName ?community_name . }
        OPTIONAL { ?community epig:communityType ?community_type_uri .
                  ?community_type_uri rdfs:label ?community_type . }
    }

    OPTIONAL {
        ?inscription epig:mentions ?relationship .
        ?relationship a epig:Relationship .
        OPTIONAL { ?relationship epig:relationshipType ?rel_type_uri .
                  ?rel_type_uri rdfs:label ?rel_type . }
        OPTIONAL { ?relationship epig:relationshipProperty ?rel_property . }
        OPTIONAL { ?relationship epig:source ?rel_source . }
        OPTIONAL { ?relationship epig:target ?rel_target . }
    }
}
`;

    const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return convertSPARQLtoGoldStandard(result, edcsId);
}

// SPARQLの結果をgold standard形式に変換
function convertSPARQLtoGoldStandard(sparqlResult, edcsId) {
    const bindings = sparqlResult.results.bindings;

    if (bindings.length === 0) {
        return null;
    }

    const goldStandard = {
        edcs_id: edcsId,
        persons: [],
        communities: [],
        person_relationships: [],
        notes: ''
    };

    // 人物データを集約
    const personsMap = new Map();
    const careersMap = new Map();
    const benefactionsMap = new Map();

    bindings.forEach(binding => {
        if (binding.person) {
            const personUri = binding.person.value;

            if (!personsMap.has(personUri)) {
                personsMap.set(personUri, {
                    person_id: personsMap.size,
                    person_name: binding.person_name?.value || binding.person_label?.value || 'Unknown',
                    person_name_readable: '',
                    praenomen: binding.praenomen?.value || '',
                    nomen: binding.nomen?.value || '',
                    cognomen: binding.cognomen?.value || '',
                    person_name_normalized: binding.normalized_name?.value || '',
                    person_name_link: '',
                    social_status: binding.social_status?.value || '',
                    social_status_evidence: '',
                    gender: binding.gender?.value || 'unknown',
                    gender_evidence: '',
                    ethnicity: binding.ethnicity?.value || '',
                    ethnicity_evidence: '',
                    age_at_death: binding.age_at_death?.value || '',
                    age_at_death_evidence: '',
                    career_path: [],
                    benefactions: []
                });
                careersMap.set(personUri, []);
                benefactionsMap.set(personUri, []);
            }

            // 経歴を追加
            if (binding.career_position && binding.position_name) {
                const careerUri = binding.career_position.value;
                const careers = careersMap.get(personUri);

                if (!careers.some(c => c.uri === careerUri)) {
                    careers.push({
                        uri: careerUri,
                        position: binding.position_name.value,
                        position_normalized: binding.position_normalized?.value || binding.position_name.value,
                        position_abstract: binding.position_abstract?.value || binding.position_name.value,
                        position_type: binding.position_type?.value || '',
                        order: parseInt(binding.position_order?.value) || careers.length + 1
                    });
                }
            }

            // 恵与行為を追加
            if (binding.benefaction && binding.benef_type) {
                const benefUri = binding.benefaction.value;
                const benefactions = benefactionsMap.get(personUri);

                if (!benefactions.some(b => b.uri === benefUri)) {
                    benefactions.push({
                        uri: benefUri,
                        benefaction_type: binding.benef_type.value,
                        benefaction_object: binding.benef_object?.value || '',
                        cost: binding.benef_cost?.value || '',
                        evidence: ''
                    });
                }
            }
        }

        // コミュニティデータを集約
        if (binding.community) {
            const communityUri = binding.community.value;
            if (!goldStandard.communities.some(c => c.uri === communityUri)) {
                goldStandard.communities.push({
                    uri: communityUri,
                    community_id: goldStandard.communities.length,
                    community_name: binding.community_name?.value || 'Unknown',
                    community_name_normalized: binding.community_name?.value || '',
                    community_type: binding.community_type?.value || '',
                    community_description: ''
                });
            }
        }

        // 関係性データを集約
        if (binding.relationship && binding.rel_type) {
            const relUri = binding.relationship.value;
            if (!goldStandard.person_relationships.some(r => r.uri === relUri)) {
                goldStandard.person_relationships.push({
                    uri: relUri,
                    relationship_type: binding.rel_type.value,
                    relationship_property: binding.rel_property?.value || '',
                    source_person_id: 0, // URIからIDへの変換が必要
                    target_person_id: null,
                    target_community_id: null,
                    evidence: ''
                });
            }
        }
    });

    // 人物データを配列に変換
    personsMap.forEach((person, personUri) => {
        // 経歴を追加
        const careers = careersMap.get(personUri) || [];
        person.career_path = careers
            .sort((a, b) => a.order - b.order)
            .map(c => ({
                position: c.position,
                position_normalized: c.position_normalized,
                position_abstract: c.position_abstract,
                position_type: c.position_type,
                order: c.order
            }));

        // 恵与行為を追加
        const benefactions = benefactionsMap.get(personUri) || [];
        person.benefactions = benefactions.map(b => ({
            benefaction_type: b.benefaction_type,
            benefaction_object: b.benefaction_object,
            cost: b.cost,
            evidence: b.evidence
        }));

        goldStandard.persons.push(person);
    });

    // URIを削除
    goldStandard.communities.forEach(c => delete c.uri);
    goldStandard.person_relationships.forEach(r => delete r.uri);

    return goldStandard;
}

// 人物追加
function addPerson() {
    const person = {
        person_id: personIdCounter++,
        person_name: '',
        person_name_readable: '',
        praenomen: '',
        nomen: '',
        cognomen: '',
        person_name_normalized: '',
        person_name_link: '',
        social_status: '',
        social_status_evidence: '',
        gender: 'unknown',
        gender_evidence: '',
        ethnicity: '',
        ethnicity_evidence: '',
        age_at_death: '',
        age_at_death_evidence: '',
        career_path: [],
        benefactions: []
    };
    data.persons.push(person);
    renderPersons();
}

// 人物削除
function removePerson(index) {
    if (confirm('この人物を削除しますか？')) {
        data.persons.splice(index, 1);
        renderPersons();
    }
}

// 経歴追加
function addCareer(personIndex) {
    const person = data.persons[personIndex];
    const career = {
        position: '',
        position_normalized: '',
        position_abstract: '',
        position_type: '',
        order: person.career_path.length + 1
    };
    person.career_path.push(career);
    renderPersons();
}

// 経歴削除
function removeCareer(personIndex, careerIndex) {
    data.persons[personIndex].career_path.splice(careerIndex, 1);
    renderPersons();
}

// 恵与行為追加
function addBenefaction(personIndex) {
    const benefaction = {
        benefaction_type: '',
        benefaction_object: '',
        cost: '',
        evidence: ''
    };
    data.persons[personIndex].benefactions.push(benefaction);
    renderPersons();
}

// 恵与行為削除
function removeBenefaction(personIndex, benefIndex) {
    data.persons[personIndex].benefactions.splice(benefIndex, 1);
    renderPersons();
}

// コミュニティ追加
function addCommunity() {
    const community = {
        community_id: communityIdCounter++,
        community_name: '',
        community_name_normalized: '',
        community_type: '',
        community_description: ''
    };
    data.communities.push(community);
    renderCommunities();
}

// コミュニティ削除
function removeCommunity(index) {
    if (confirm('このコミュニティを削除しますか？')) {
        data.communities.splice(index, 1);
        renderCommunities();
    }
}

// 関係性追加
function addRelationship() {
    const relationship = {
        relationship_type: '',
        relationship_property: '',
        source_person_id: 0,
        target_person_id: null,
        target_community_id: null,
        evidence: ''
    };
    data.person_relationships.push(relationship);
    renderRelationships();
}

// 関係性削除
function removeRelationship(index) {
    if (confirm('この関係性を削除しますか？')) {
        data.person_relationships.splice(index, 1);
        renderRelationships();
    }
}

// 人物レンダリング
function renderPersons() {
    const container = document.getElementById('personsContainer');
    if (data.persons.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">人物を追加してください</p>';
        return;
    }

    container.innerHTML = data.persons.map((person, index) => `
        <div class="card">
            <div class="card-header">
                <span class="card-title">Person ${person.person_id}: ${person.person_name || '(名前未入力)'}</span>
                <button class="btn-remove" onclick="removePerson(${index})">削除</button>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>人物名 (原文)</label>
                    <input type="text" value="${person.person_name}"
                           onchange="data.persons[${index}].person_name = this.value">
                </div>
                <div class="form-group">
                    <label>人物名 (読みやすい形式)</label>
                    <input type="text" value="${person.person_name_readable}"
                           onchange="data.persons[${index}].person_name_readable = this.value">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>Praenomen</label>
                    <input type="text" value="${person.praenomen}"
                           onchange="data.persons[${index}].praenomen = this.value">
                </div>
                <div class="form-group">
                    <label>Nomen</label>
                    <input type="text" value="${person.nomen}"
                           onchange="data.persons[${index}].nomen = this.value">
                </div>
            </div>

            <div class="form-group">
                <label>Cognomen</label>
                <input type="text" value="${person.cognomen}"
                       onchange="data.persons[${index}].cognomen = this.value">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>社会的身分</label>
                    <select onchange="data.persons[${index}].social_status = this.value">
                        <option value="">選択してください</option>
                        <optgroup label="Imperial Family">
                            <option value="emperor" ${person.social_status === 'emperor' ? 'selected' : ''}>emperor</option>
                            <option value="empress" ${person.social_status === 'empress' ? 'selected' : ''}>empress</option>
                            <option value="imperial-family" ${person.social_status === 'imperial-family' ? 'selected' : ''}>imperial-family</option>
                        </optgroup>
                        <optgroup label="Senatorial Order">
                            <option value="senator-clarissimus" ${person.social_status === 'senator-clarissimus' ? 'selected' : ''}>senator-clarissimus</option>
                            <option value="senator-consularis" ${person.social_status === 'senator-consularis' ? 'selected' : ''}>senator-consularis</option>
                            <option value="senator-praetorius" ${person.social_status === 'senator-praetorius' ? 'selected' : ''}>senator-praetorius</option>
                        </optgroup>
                        <optgroup label="Equestrian Order">
                            <option value="equestrian-perfectissimus" ${person.social_status === 'equestrian-perfectissimus' ? 'selected' : ''}>equestrian-perfectissimus</option>
                            <option value="equestrian-egregius" ${person.social_status === 'equestrian-egregius' ? 'selected' : ''}>equestrian-egregius</option>
                            <option value="equestrian-splendidus" ${person.social_status === 'equestrian-splendidus' ? 'selected' : ''}>equestrian-splendidus</option>
                            <option value="equestrian" ${person.social_status === 'equestrian' ? 'selected' : ''}>equestrian</option>
                        </optgroup>
                        <optgroup label="Municipal Elite">
                            <option value="decurio" ${person.social_status === 'decurio' ? 'selected' : ''}>decurio</option>
                            <option value="duovir" ${person.social_status === 'duovir' ? 'selected' : ''}>duovir</option>
                            <option value="aedilis" ${person.social_status === 'aedilis' ? 'selected' : ''}>aedilis</option>
                            <option value="quaestor" ${person.social_status === 'quaestor' ? 'selected' : ''}>quaestor</option>
                            <option value="municipal-magistrate" ${person.social_status === 'municipal-magistrate' ? 'selected' : ''}>municipal-magistrate</option>
                        </optgroup>
                        <optgroup label="Military">
                            <option value="legatus" ${person.social_status === 'legatus' ? 'selected' : ''}>legatus</option>
                            <option value="tribunus" ${person.social_status === 'tribunus' ? 'selected' : ''}>tribunus</option>
                            <option value="centurio" ${person.social_status === 'centurio' ? 'selected' : ''}>centurio</option>
                            <option value="soldier" ${person.social_status === 'soldier' ? 'selected' : ''}>soldier</option>
                            <option value="veteran" ${person.social_status === 'veteran' ? 'selected' : ''}>veteran</option>
                        </optgroup>
                        <optgroup label="Legal Status">
                            <option value="freedman" ${person.social_status === 'freedman' ? 'selected' : ''}>freedman</option>
                            <option value="freedwoman" ${person.social_status === 'freedwoman' ? 'selected' : ''}>freedwoman</option>
                            <option value="slave" ${person.social_status === 'slave' ? 'selected' : ''}>slave</option>
                            <option value="freeborn" ${person.social_status === 'freeborn' ? 'selected' : ''}>freeborn</option>
                        </optgroup>
                        <optgroup label="Priesthood">
                            <option value="flamen" ${person.social_status === 'flamen' ? 'selected' : ''}>flamen</option>
                            <option value="pontifex" ${person.social_status === 'pontifex' ? 'selected' : ''}>pontifex</option>
                            <option value="augur" ${person.social_status === 'augur' ? 'selected' : ''}>augur</option>
                            <option value="sacerdos" ${person.social_status === 'sacerdos' ? 'selected' : ''}>sacerdos</option>
                        </optgroup>
                        <optgroup label="Occupations">
                            <option value="merchant" ${person.social_status === 'merchant' ? 'selected' : ''}>merchant</option>
                            <option value="medicus" ${person.social_status === 'medicus' ? 'selected' : ''}>medicus</option>
                            <option value="gladiator" ${person.social_status === 'gladiator' ? 'selected' : ''}>gladiator</option>
                            <option value="actor" ${person.social_status === 'actor' ? 'selected' : ''}>actor</option>
                            <option value="artisan" ${person.social_status === 'artisan' ? 'selected' : ''}>artisan</option>
                        </optgroup>
                        <optgroup label="Other">
                            <option value="unknown" ${person.social_status === 'unknown' ? 'selected' : ''}>unknown</option>
                            <option value="citizen" ${person.social_status === 'citizen' ? 'selected' : ''}>citizen</option>
                        </optgroup>
                    </select>
                </div>
                <div class="form-group">
                    <label>性別</label>
                    <select onchange="data.persons[${index}].gender = this.value">
                        <option value="unknown" ${person.gender === 'unknown' ? 'selected' : ''}>unknown</option>
                        <option value="male" ${person.gender === 'male' ? 'selected' : ''}>male</option>
                        <option value="female" ${person.gender === 'female' ? 'selected' : ''}>female</option>
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label>社会的身分の根拠</label>
                <textarea rows="2" onchange="data.persons[${index}].social_status_evidence = this.value">${person.social_status_evidence}</textarea>
            </div>

            <!-- 経歴セクション -->
            <div class="nested-section">
                <div class="nested-header">
                    <h5>経歴 (Career Path)</h5>
                    <button class="btn-add" onclick="addCareer(${index})">+ 職位追加</button>
                </div>
                ${renderCareerPath(person.career_path, index)}
            </div>

            <!-- 恵与行為セクション -->
            <div class="nested-section">
                <div class="nested-header">
                    <h5>恵与行為 (Benefactions)</h5>
                    <button class="btn-add" onclick="addBenefaction(${index})">+ 恵与追加</button>
                </div>
                ${renderBenefactions(person.benefactions, index)}
            </div>
        </div>
    `).join('');
}

// 経歴パスレンダリング
function renderCareerPath(careers, personIndex) {
    if (!careers || careers.length === 0) {
        return '<p style="color: #999; font-size: 13px; padding: 10px;">経歴なし</p>';
    }

    return careers.map((career, careerIndex) => `
        <div class="nested-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #555;">職位 ${careerIndex + 1}</strong>
                <button class="btn-remove" onclick="removeCareer(${personIndex}, ${careerIndex})">削除</button>
            </div>
            <div class="form-group">
                <label>職位名 (原文)</label>
                <input type="text" value="${career.position}"
                       onchange="data.persons[${personIndex}].career_path[${careerIndex}].position = this.value">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>職位 (正規化)</label>
                    <input type="text" value="${career.position_normalized}"
                           onchange="data.persons[${personIndex}].career_path[${careerIndex}].position_normalized = this.value">
                </div>
                <div class="form-group">
                    <label>職位 (抽象形)</label>
                    <input type="text" value="${career.position_abstract}"
                           onchange="data.persons[${personIndex}].career_path[${careerIndex}].position_abstract = this.value">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>職位タイプ</label>
                    <select onchange="data.persons[${personIndex}].career_path[${careerIndex}].position_type = this.value">
                        <option value="">選択してください</option>
                        <option value="military" ${career.position_type === 'military' ? 'selected' : ''}>military</option>
                        <option value="imperial-administration" ${career.position_type === 'imperial-administration' ? 'selected' : ''}>imperial-administration</option>
                        <option value="provincial-administration" ${career.position_type === 'provincial-administration' ? 'selected' : ''}>provincial-administration</option>
                        <option value="local-administration" ${career.position_type === 'local-administration' ? 'selected' : ''}>local-administration</option>
                        <option value="priesthood" ${career.position_type === 'priesthood' ? 'selected' : ''}>priesthood</option>
                        <option value="imperial-priesthood" ${career.position_type === 'imperial-priesthood' ? 'selected' : ''}>imperial-priesthood</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>順序</label>
                    <input type="number" value="${career.order}"
                           onchange="data.persons[${personIndex}].career_path[${careerIndex}].order = parseInt(this.value)">
                </div>
            </div>
        </div>
    `).join('');
}

// 恵与行為レンダリング
function renderBenefactions(benefactions, personIndex) {
    if (!benefactions || benefactions.length === 0) {
        return '<p style="color: #999; font-size: 13px; padding: 10px;">恵与行為なし</p>';
    }

    return benefactions.map((benef, benefIndex) => `
        <div class="nested-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong style="color: #555;">恵与 ${benefIndex + 1}</strong>
                <button class="btn-remove" onclick="removeBenefaction(${personIndex}, ${benefIndex})">削除</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>恵与タイプ</label>
                    <select onchange="data.persons[${personIndex}].benefactions[${benefIndex}].benefaction_type = this.value">
                        <option value="">選択してください</option>
                        <option value="construction" ${benef.benefaction_type === 'construction' ? 'selected' : ''}>construction</option>
                        <option value="repair" ${benef.benefaction_type === 'repair' ? 'selected' : ''}>repair</option>
                        <option value="donation" ${benef.benefaction_type === 'donation' ? 'selected' : ''}>donation</option>
                        <option value="games" ${benef.benefaction_type === 'games' ? 'selected' : ''}>games</option>
                        <option value="feast" ${benef.benefaction_type === 'feast' ? 'selected' : ''}>feast</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>対象物 (ラテン語)</label>
                    <input type="text" value="${benef.benefaction_object}"
                           onchange="data.persons[${personIndex}].benefactions[${benefIndex}].benefaction_object = this.value">
                </div>
            </div>
            <div class="form-group">
                <label>費用</label>
                <input type="text" value="${benef.cost}"
                       onchange="data.persons[${personIndex}].benefactions[${benefIndex}].cost = this.value">
            </div>
            <div class="form-group">
                <label>根拠テキスト</label>
                <textarea rows="2" onchange="data.persons[${personIndex}].benefactions[${benefIndex}].evidence = this.value">${benef.evidence}</textarea>
            </div>
        </div>
    `).join('');
}

// コミュニティレンダリング
function renderCommunities() {
    const container = document.getElementById('communitiesContainer');
    if (data.communities.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">コミュニティを追加してください</p>';
        return;
    }

    container.innerHTML = data.communities.map((community, index) => `
        <div class="card">
            <div class="card-header">
                <span class="card-title">Community ${community.community_id}: ${community.community_name || '(名前未入力)'}</span>
                <button class="btn-remove" onclick="removeCommunity(${index})">削除</button>
            </div>

            <div class="form-group">
                <label>コミュニティ名 (正規化形)</label>
                <input type="text" value="${community.community_name}"
                       onchange="data.communities[${index}].community_name = this.value">
            </div>

            <div class="form-group">
                <label>コミュニティタイプ</label>
                <select onchange="data.communities[${index}].community_type = this.value">
                    <option value="">選択してください</option>
                    <option value="legion" ${community.community_type === 'legion' ? 'selected' : ''}>legion</option>
                    <option value="cohort" ${community.community_type === 'cohort' ? 'selected' : ''}>cohort</option>
                    <option value="ala" ${community.community_type === 'ala' ? 'selected' : ''}>ala</option>
                    <option value="city" ${community.community_type === 'city' ? 'selected' : ''}>city</option>
                    <option value="municipium" ${community.community_type === 'municipium' ? 'selected' : ''}>municipium</option>
                    <option value="colonia" ${community.community_type === 'colonia' ? 'selected' : ''}>colonia</option>
                    <option value="collegium" ${community.community_type === 'collegium' ? 'selected' : ''}>collegium</option>
                    <option value="ordo" ${community.community_type === 'ordo' ? 'selected' : ''}>ordo</option>
                </select>
            </div>

            <div class="form-group">
                <label>説明 (英語)</label>
                <textarea rows="2" onchange="data.communities[${index}].community_description = this.value">${community.community_description}</textarea>
            </div>
        </div>
    `).join('');
}

// 関係性レンダリング
function renderRelationships() {
    const container = document.getElementById('relationshipsContainer');
    if (data.person_relationships.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">関係性を追加してください</p>';
        return;
    }

    container.innerHTML = data.person_relationships.map((rel, index) => `
        <div class="card">
            <div class="card-header">
                <span class="card-title">Relationship ${index + 1}</span>
                <button class="btn-remove" onclick="removeRelationship(${index})">削除</button>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>関係性タイプ</label>
                    <select onchange="data.person_relationships[${index}].relationship_type = this.value; renderRelationships();">
                        <option value="">選択してください</option>
                        <option value="family" ${rel.relationship_type === 'family' ? 'selected' : ''}>family</option>
                        <option value="colleague" ${rel.relationship_type === 'colleague' ? 'selected' : ''}>colleague</option>
                        <option value="patronage" ${rel.relationship_type === 'patronage' ? 'selected' : ''}>patronage</option>
                        <option value="dedication" ${rel.relationship_type === 'dedication' ? 'selected' : ''}>dedication</option>
                        <option value="economic" ${rel.relationship_type === 'economic' ? 'selected' : ''}>economic</option>
                        <option value="affiliation" ${rel.relationship_type === 'affiliation' ? 'selected' : ''}>affiliation</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>関係性プロパティ</label>
                    <select onchange="data.person_relationships[${index}].relationship_property = this.value">
                        <option value="">選択してください</option>
                        ${relationshipProperties[rel.relationship_type]?.map(prop =>
                            `<option value="${prop}" ${rel.relationship_property === prop ? 'selected' : ''}>${prop}</option>`
                        ).join('') || ''}
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>起点 (Person ID)</label>
                    <select onchange="data.person_relationships[${index}].source_person_id = parseInt(this.value)">
                        ${data.persons.map(p =>
                            `<option value="${p.person_id}" ${rel.source_person_id === p.person_id ? 'selected' : ''}>
                                Person ${p.person_id}: ${p.person_name || '(名前未入力)'}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>対象</label>
                    <div class="form-row">
                        <select onchange="data.person_relationships[${index}].target_person_id = this.value ? parseInt(this.value) : null; data.person_relationships[${index}].target_community_id = null;">
                            <option value="">Person選択</option>
                            ${data.persons.map(p =>
                                `<option value="${p.person_id}" ${rel.target_person_id === p.person_id ? 'selected' : ''}>
                                    Person ${p.person_id}: ${p.person_name || '(名前未入力)'}
                                </option>`
                            ).join('')}
                        </select>
                        <select onchange="data.person_relationships[${index}].target_community_id = this.value ? parseInt(this.value) : null; data.person_relationships[${index}].target_person_id = null;">
                            <option value="">Community選択</option>
                            ${data.communities.map(c =>
                                `<option value="${c.community_id}" ${rel.target_community_id === c.community_id ? 'selected' : ''}>
                                    Community ${c.community_id}: ${c.community_name || '(名前未入力)'}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label>根拠テキスト</label>
                <textarea rows="2" onchange="data.person_relationships[${index}].evidence = this.value">${rel.evidence}</textarea>
            </div>
        </div>
    `).join('');
}

// データ保存
function saveData() {
    saveCurrentInscriptionData();
    showStatus('現在の碑文データを保存しました', true);
}

// JSON出力 (現在の碑文のgold_standardデータのみ)
function exportJSON() {
    saveCurrentInscriptionData();

    if (allInscriptions.length === 0 || currentIndex >= allInscriptions.length) {
        showStatus('エクスポートする碑文データがありません', false);
        return;
    }

    const currentInscription = allInscriptions[currentIndex];
    const edcsId = currentInscription['EDCS-ID'] || 'unknown';

    // gold_standardデータのみを出力
    const outputData = currentInscription.gold_standard || data;

    // has_careerを自動設定（配列の有無で判断）
    outputData.persons.forEach(person => {
        person.has_career = person.career_path && person.career_path.length > 0;
    });

    const jsonStr = JSON.stringify(outputData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gold_standard_${edcsId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus(`碑文 ${edcsId} のgold_standardデータをエクスポートしました`, true);
}

// クリア
function clearAll() {
    if (confirm('すべてのデータをクリアしますか？')) {
        allInscriptions = [];
        currentIndex = 0;
        data = {
            edcs_id: '',
            persons: [],
            communities: [],
            person_relationships: [],
            notes: ''
        };
        document.getElementById('inscriptionText').textContent = 'JSONファイルを読み込んでください';
        document.getElementById('edcsId').textContent = '-';
        document.getElementById('place').textContent = '-';
        document.getElementById('dating').textContent = '-';
        document.getElementById('notes').value = '';
        renderPersons();
        renderCommunities();
        renderRelationships();
        updatePagination();
        showStatus('データをクリアしました', true);
    }
}

// ステータス表示
function showStatus(message, success = true, type = null) {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message status-${type || (success ? 'success' : 'error')}`;
    statusDiv.textContent = message;
    document.body.appendChild(statusDiv);

    setTimeout(() => {
        statusDiv.remove();
    }, 3000);
}

// 初期化
updatePagination();
