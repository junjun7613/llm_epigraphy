// Gold Standard Editor JavaScript with Pagination

let allInscriptions = [];  // 全碑文データ
let currentIndex = 0;       // 現在表示中のインデックス
let data = {
    edcs_id: '',
    persons: [],
    communities: [],
    person_relationships: [],
    notes: ''
};

let personIdCounter = 0;
let communityIdCounter = 0;

// 関係性プロパティの定義（タイプごと）
const relationshipProperties = {
    family: ["father", "mother", "son", "daughter", "brother", "sister", "spouse", "husband", "wife", "grandfather", "grandmother", "grandson", "granddaughter", "uncle", "aunt", "nephew", "niece", "cousin"],
    colleague: ["co-officer", "fellow-soldier", "colleague", "associate"],
    patronage: ["patron", "client", "freedman", "freedwoman", "former-owner"],
    dedication: ["dedicator", "dedicatee", "honored-person", "person-who-erected"],
    economic: ["buyer", "seller", "debtor", "creditor", "business-partner", "tenant", "landlord", "contractor", "employer", "employee"],
    affiliation: ["member", "soldier", "decurion", "citizen", "resident", "officer", "priest"]
};

// ステータスメッセージ表示
function showStatus(message, isSuccess = true) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = 'status-message ' + (isSuccess ? 'status-success' : 'status-error');
    statusEl.style.display = 'block';
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

// ページネーション更新
function updatePagination() {
    const pageInfo = document.getElementById('pageInfo');
    const btnPrev = document.getElementById('btnPrev');
    const btnNext = document.getElementById('btnNext');

    if (allInscriptions.length === 0) {
        pageInfo.textContent = '0 / 0';
        btnPrev.disabled = true;
        btnNext.disabled = true;
    } else {
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
function loadInscription(index) {
    if (index < 0 || index >= allInscriptions.length) return;

    const inscription = allInscriptions[index];

    // 碑文情報を表示
    document.getElementById('edcsId').textContent = inscription['EDCS-ID'] || '-';
    document.getElementById('place').textContent = inscription.place || '-';

    let dating = '-';
    if (inscription.dating_from || inscription.dating_to) {
        dating = `${inscription.dating_from || '?'} ~ ${inscription.dating_to || '?'}`;
    } else if (inscription.date_not_before || inscription.date_not_after) {
        dating = `${inscription.date_not_before || '?'} ~ ${inscription.date_not_after || '?'}`;
    }
    document.getElementById('dating').textContent = dating;
    document.getElementById('inscriptionText').textContent = inscription.inscription || '碑文テキストなし';

    // 既存のgold_standardデータがあればロード、なければ初期化
    if (inscription.gold_standard) {
        data = JSON.parse(JSON.stringify(inscription.gold_standard));
    } else {
        data = {
            edcs_id: inscription['EDCS-ID'] || '',
            persons: [],
            communities: [],
            person_relationships: [],
            notes: ''
        };
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
    const career = {
        position: '',
        position_normalized: '',
        position_abstract: '',
        position_type: 'other',
        position_description: '',
        order: data.persons[personIndex].career_path.length + 1
    };
    data.persons[personIndex].career_path.push(career);
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
        benefaction_type: 'other',
        object: '',
        object_type: '',
        object_description: '',
        benefaction_text: '',
        cost: '',
        notes: ''
    };
    data.persons[personIndex].benefactions.push(benefaction);
    renderPersons();
}

// 恵与行為削除
function removeBenefaction(personIndex, benefactionIndex) {
    data.persons[personIndex].benefactions.splice(benefactionIndex, 1);
    renderPersons();
}

// コミュニティ追加
function addCommunity() {
    const community = {
        community_id: communityIdCounter++,
        community_name: '',
        community_name_normalized: '',
        community_type: 'other',
        community_description: '',
        evidence: ''
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
        source_person_id: 0,
        target_person_id: null,
        target_community_id: null,
        type: 'family',
        property: '',
        property_text: '',
        notes: ''
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
    container.innerHTML = '';

    data.persons.forEach((person, index) => {
        const card = document.createElement('div');
        card.className = 'person-card';
        card.innerHTML = `
            <div class="card-header">
                <h4>人物 ${index + 1} (ID: ${person.person_id})</h4>
                <button class="btn-remove" onclick="removePerson(${index})">削除</button>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label>人物��� (ラテン語形式)</label>
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
        `;
        container.appendChild(card);
    });
}

// 経歴パスレンダリング
function renderCareerPath(careers, personIndex) {
    if (careers.length === 0) return '<p class="help-text">職位がありません</p>';

    return careers.map((career, careerIndex) => `
        <div class="career-card">
            <div class="card-header">
                <h4>職位 ${career.order}</h4>
                <button class="btn-remove" onclick="removeCareer(${personIndex}, ${careerIndex})">削除</button>
            </div>
            <div class="form-group">
                <label>職位 (原文)</label>
                <input type="text" value="${career.position}"
                       onchange="data.persons[${personIndex}].career_path[${careerIndex}].position = this.value">
            </div>
            <div class="form-group">
                <label>職位 (正規化形)</label>
                <input type="text" value="${career.position_normalized}"
                       onchange="data.persons[${personIndex}].career_path[${careerIndex}].position_normalized = this.value">
            </div>
            <div class="form-group">
                <label>職位 (抽象形)</label>
                <input type="text" value="${career.position_abstract}"
                       onchange="data.persons[${personIndex}].career_path[${careerIndex}].position_abstract = this.value">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>職位タイプ</label>
                    <select onchange="data.persons[${personIndex}].career_path[${careerIndex}].position_type = this.value">
                        <option value="military" ${career.position_type === 'military' ? 'selected' : ''}>military</option>
                        <option value="imperial-administration" ${career.position_type === 'imperial-administration' ? 'selected' : ''}>imperial-administration</option>
                        <option value="provincial-administration" ${career.position_type === 'provincial-administration' ? 'selected' : ''}>provincial-administration</option>
                        <option value="local-administration" ${career.position_type === 'local-administration' ? 'selected' : ''}>local-administration</option>
                        <option value="imperial-priesthood" ${career.position_type === 'imperial-priesthood' ? 'selected' : ''}>imperial-priesthood</option>
                        <option value="provincial-priesthood" ${career.position_type === 'provincial-priesthood' ? 'selected' : ''}>provincial-priesthood</option>
                        <option value="local-priesthood" ${career.position_type === 'local-priesthood' ? 'selected' : ''}>local-priesthood</option>
                        <option value="occupation" ${career.position_type === 'occupation' ? 'selected' : ''}>occupation</option>
                        <option value="other" ${career.position_type === 'other' ? 'selected' : ''}>other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>順序</label>
                    <input type="number" value="${career.order}" min="1"
                           onchange="data.persons[${personIndex}].career_path[${careerIndex}].order = parseInt(this.value)">
                </div>
            </div>
            <div class="form-group">
                <label>職位の説明 (英語)</label>
                <textarea rows="2" onchange="data.persons[${personIndex}].career_path[${careerIndex}].position_description = this.value">${career.position_description}</textarea>
            </div>
        </div>
    `).join('');
}

// 恵与行為レンダリング
function renderBenefactions(benefactions, personIndex) {
    if (benefactions.length === 0) return '<p class="help-text">恵与行為がありません</p>';

    return benefactions.map((benef, benefIndex) => `
        <div class="benefaction-card">
            <div class="card-header">
                <h4>恵与 ${benefIndex + 1}</h4>
                <button class="btn-remove" onclick="removeBenefaction(${personIndex}, ${benefIndex})">削除</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>恵与タイプ</label>
                    <select onchange="data.persons[${personIndex}].benefactions[${benefIndex}].benefaction_type = this.value">
                        <option value="construction" ${benef.benefaction_type === 'construction' ? 'selected' : ''}>construction</option>
                        <option value="repair" ${benef.benefaction_type === 'repair' ? 'selected' : ''}>repair</option>
                        <option value="donation" ${benef.benefaction_type === 'donation' ? 'selected' : ''}>donation</option>
                        <option value="games" ${benef.benefaction_type === 'games' ? 'selected' : ''}>games</option>
                        <option value="feast" ${benef.benefaction_type === 'feast' ? 'selected' : ''}>feast</option>
                        <option value="other" ${benef.benefaction_type === 'other' ? 'selected' : ''}>other</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>対象物タイプ</label>
                    <input type="text" value="${benef.object_type}"
                           onchange="data.persons[${personIndex}].benefactions[${benefIndex}].object_type = this.value">
                </div>
            </div>
            <div class="form-group">
                <label>対象物 (ラテン語)</label>
                <input type="text" value="${benef.object}"
                       onchange="data.persons[${personIndex}].benefactions[${benefIndex}].object = this.value">
            </div>
            <div class="form-group">
                <label>根拠テキスト</label>
                <textarea rows="2" onchange="data.persons[${personIndex}].benefactions[${benefIndex}].benefaction_text = this.value">${benef.benefaction_text}</textarea>
            </div>
        </div>
    `).join('');
}

// コミュニティレンダリング
function renderCommunities() {
    const container = document.getElementById('communitiesContainer');
    if (data.communities.length === 0) {
        container.innerHTML = '<p class="help-text">コミュニティがありません</p>';
        return;
    }

    container.innerHTML = data.communities.map((community, index) => `
        <div class="community-card">
            <div class="card-header">
                <h4>コミュニティ ${index + 1} (ID: ${community.community_id})</h4>
                <button class="btn-remove" onclick="removeCommunity(${index})">削除</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>コミュニティ名</label>
                    <input type="text" value="${community.community_name}"
                           onchange="data.communities[${index}].community_name = this.value">
                </div>
                <div class="form-group">
                    <label>コミュニティ名 (正規化)</label>
                    <input type="text" value="${community.community_name_normalized}"
                           onchange="data.communities[${index}].community_name_normalized = this.value">
                </div>
            </div>
            <div class="form-group">
                <label>コミュニティタイプ</label>
                <select onchange="data.communities[${index}].community_type = this.value">
                    <option value="legion" ${community.community_type === 'legion' ? 'selected' : ''}>legion</option>
                    <option value="cohort" ${community.community_type === 'cohort' ? 'selected' : ''}>cohort</option>
                    <option value="city" ${community.community_type === 'city' ? 'selected' : ''}>city</option>
                    <option value="municipium" ${community.community_type === 'municipium' ? 'selected' : ''}>municipium</option>
                    <option value="colonia" ${community.community_type === 'colonia' ? 'selected' : ''}>colonia</option>
                    <option value="collegium" ${community.community_type === 'collegium' ? 'selected' : ''}>collegium</option>
                    <option value="ordo" ${community.community_type === 'ordo' ? 'selected' : ''}>ordo</option>
                    <option value="other" ${community.community_type === 'other' ? 'selected' : ''}>other</option>
                </select>
            </div>
            <div class="form-group">
                <label>説明</label>
                <textarea rows="2" onchange="data.communities[${index}].community_description = this.value">${community.community_description}</textarea>
            </div>
            <div class="form-group">
                <label>根拠テキスト</label>
                <textarea rows="2" onchange="data.communities[${index}].evidence = this.value">${community.evidence}</textarea>
            </div>
        </div>
    `).join('');
}

// 関係性レンダリング
function renderRelationships() {
    const container = document.getElementById('relationshipsContainer');
    if (data.person_relationships.length === 0) {
        container.innerHTML = '<p class="help-text">関係性がありません</p>';
        return;
    }

    container.innerHTML = data.person_relationships.map((rel, index) => `
        <div class="relationship-card">
            <div class="card-header">
                <h4>関係性 ${index + 1}</h4>
                <button class="btn-remove" onclick="removeRelationship(${index})">削除</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>起点人物ID</label>
                    <select onchange="data.person_relationships[${index}].source_person_id = parseInt(this.value)">
                        ${data.persons.map(p => `<option value="${p.person_id}" ${rel.source_person_id === p.person_id ? 'selected' : ''}>人物 ${p.person_id}: ${p.person_name || '未入力'}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>関係性タイプ</label>
                    <select onchange="data.person_relationships[${index}].type = this.value; renderRelationships()">
                        <option value="family" ${rel.type === 'family' ? 'selected' : ''}>family</option>
                        <option value="colleague" ${rel.type === 'colleague' ? 'selected' : ''}>colleague</option>
                        <option value="patronage" ${rel.type === 'patronage' ? 'selected' : ''}>patronage</option>
                        <option value="dedication" ${rel.type === 'dedication' ? 'selected' : ''}>dedication</option>
                        <option value="economic" ${rel.type === 'economic' ? 'selected' : ''}>economic</option>
                        <option value="affiliation" ${rel.type === 'affiliation' ? 'selected' : ''}>affiliation</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                ${rel.type === 'affiliation' ? `
                <div class="form-group">
                    <label>対象コミュニティID</label>
                    <select onchange="data.person_relationships[${index}].target_community_id = parseInt(this.value); data.person_relationships[${index}].target_person_id = null">
                        <option value="">選択してください</option>
                        ${data.communities.map(c => `<option value="${c.community_id}" ${rel.target_community_id === c.community_id ? 'selected' : ''}>コミュニティ ${c.community_id}: ${c.community_name || '未入力'}</option>`).join('')}
                    </select>
                </div>
                ` : `
                <div class="form-group">
                    <label>対象人物ID</label>
                    <select onchange="data.person_relationships[${index}].target_person_id = parseInt(this.value); data.person_relationships[${index}].target_community_id = null">
                        <option value="">選択してください</option>
                        ${data.persons.map(p => `<option value="${p.person_id}" ${rel.target_person_id === p.person_id ? 'selected' : ''}>人物 ${p.person_id}: ${p.person_name || '未入力'}</option>`).join('')}
                    </select>
                </div>
                `}
                <div class="form-group">
                    <label>関係性プロパティ</label>
                    <select onchange="data.person_relationships[${index}].property = this.value">
                        <option value="">選択してください</option>
                        ${relationshipProperties[rel.type]?.map(prop =>
                            `<option value="${prop}" ${rel.property === prop ? 'selected' : ''}>${prop}</option>`
                        ).join('') || ''}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>根拠テキスト</label>
                <textarea rows="2" onchange="data.person_relationships[${index}].property_text = this.value">${rel.property_text}</textarea>
            </div>
        </div>
    `).join('');
}

// JSON読み込み
function loadJSON() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = JSON.parse(e.target.result);

            // 配列として読み込み
            if (Array.isArray(jsonData)) {
                allInscriptions = jsonData;
                currentIndex = 0;

                if (allInscriptions.length > 0) {
                    loadInscription(0);
                    showStatus(`${allInscriptions.length}件の碑文を読み込みました`, true);
                } else {
                    showStatus('碑文データが空です', false);
                }
            } else {
                showStatus('配列形式のJSONファイルを選択してください', false);
            }
        } catch (error) {
            showStatus('JSONファイルの読み込みに失敗しました: ' + error.message, false);
        }
    };
    reader.readAsText(file);
}

// データ保存 (現在の碑文のみ)
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

// 初期化
updatePagination();
