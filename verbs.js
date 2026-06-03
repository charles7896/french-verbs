'use strict';

// ─── Subjects ────────────────────────────────────────────────────────────────
const SUBJECTS = ['je', 'tu', 'il/elle', 'nous', 'vous', 'ils/elles'];

// ─── Tense metadata ──────────────────────────────────────────────────────────
const TENSES = {
  // ── Core curriculum (semaines 33–34) ──
  present:              { label: 'Présent',              compound: false },
  imparfait:            { label: 'Imparfait',            compound: false },
  futurSimple:          { label: 'Futur simple',         compound: false },
  conditionnelPresent:  { label: 'Conditionnel présent', compound: false },
  imperatif:            { label: 'Impératif présent',    compound: false },
  passeCompose:         { label: 'Passé composé',        compound: true  },
  participePresent:     { label: 'Participe présent',    compound: false, single: true },
  participePasse:       { label: 'Participe passé',      compound: false, single: true },
  futurProche:          { label: 'Futur proche',         compound: false, periphrastic: true },
  subjonctifPresent:    { label: 'Subjonctif présent',   compound: false },
  passeSimple:          { label: 'Passé simple',         compound: false },
  // ── Extra tenses (bonus practice) ──
  plusQueParfait:       { label: 'Plus-que-parfait',     compound: true  },
  futurAnterieur:       { label: 'Futur antérieur',      compound: true  },
  conditionnelPasse:    { label: 'Conditionnel passé',   compound: true  },
};

// ─── Auxiliary tables (used for compound tenses) ──────────────────────────────
const AUX = {
  avoir: {
    present:             ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
    imparfait:           ['avais', 'avais', 'avait', 'avions', 'aviez', 'avaient'],
    futurSimple:         ['aurai', 'auras', 'aura', 'aurons', 'aurez', 'auront'],
    conditionnelPresent: ['aurais', 'aurais', 'aurait', 'aurions', 'auriez', 'auraient'],
  },
  être: {
    present:             ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'],
    imparfait:           ['étais', 'étais', 'était', 'étions', 'étiez', 'étaient'],
    futurSimple:         ['serai', 'seras', 'sera', 'serons', 'serez', 'seront'],
    conditionnelPresent: ['serais', 'serais', 'serait', 'serions', 'seriez', 'seraient'],
  },
};

// For être verbs, the participle agrees. We store the masc-sing form and note it.
function buildCompound(aux, auxTense, participle) {
  return AUX[aux][auxTense].map(f => f + ' ' + participle);
}

// ─── Regular conjugation generators ──────────────────────────────────────────

function conjugateER(stem, infinitive) {
  return {
    present:             [stem+'e',    stem+'es',   stem+'e',    stem+'ons',   stem+'ez',    stem+'ent'],
    imparfait:           [stem+'ais',  stem+'ais',  stem+'ait',  stem+'ions',  stem+'iez',   stem+'aient'],
    futurSimple:         [infinitive+'ai', infinitive+'as', infinitive+'a', infinitive+'ons', infinitive+'ez', infinitive+'ont'],
    conditionnelPresent: [infinitive+'ais', infinitive+'ais', infinitive+'ait', infinitive+'ions', infinitive+'iez', infinitive+'aient'],
    passeSimple:         [stem+'ai',   stem+'as',   stem+'a',    stem+'âmes',  stem+'âtes',  stem+'èrent'],
    subjonctifPresent:   [stem+'e',    stem+'es',   stem+'e',    stem+'ions',  stem+'iez',   stem+'ent'],
    imperatif:           [null,        stem+'e',    null,         stem+'ons',   stem+'ez',    null],
  };
}

function conjugateIR(stem, infinitive) {
  // finir-type: stem = fin
  return {
    present:             [stem+'is',      stem+'is',      stem+'it',      stem+'issons',   stem+'issez',   stem+'issent'],
    imparfait:           [stem+'issais',  stem+'issais',  stem+'issait',  stem+'issions',  stem+'issiez',  stem+'issaient'],
    futurSimple:         [infinitive+'ai', infinitive+'as', infinitive+'a', infinitive+'ons', infinitive+'ez', infinitive+'ont'],
    conditionnelPresent: [infinitive+'ais', infinitive+'ais', infinitive+'ait', infinitive+'ions', infinitive+'iez', infinitive+'aient'],
    passeSimple:         [stem+'is',      stem+'is',      stem+'it',      stem+'îmes',     stem+'îtes',    stem+'irent'],
    subjonctifPresent:   [stem+'isse',    stem+'isses',   stem+'isse',    stem+'issions',  stem+'issiez',  stem+'issent'],
    imperatif:           [null,           stem+'is',      null,            stem+'issons',   stem+'issez',   null],
  };
}

function conjugateRE(stem, infinitive) {
  // vendre-type. The future/conditional stem drops the infinitive's final "e":
  // rendre -> rendr -> rendrai, rendrons, rendront ...
  const fut = infinitive.slice(0, -1);
  return {
    present:             [stem+'s',   stem+'s',   stem,        stem+'ons',  stem+'ez',   stem+'ent'],
    imparfait:           [stem+'ais', stem+'ais', stem+'ait',  stem+'ions', stem+'iez',  stem+'aient'],
    futurSimple:         [fut+'ai',  fut+'as',  fut+'a',   fut+'ons',  fut+'ez',   fut+'ont'],
    conditionnelPresent: [fut+'ais', fut+'ais', fut+'ait', fut+'ions', fut+'iez',  fut+'aient'],
    passeSimple:         [stem+'is',  stem+'is',  stem+'it',   stem+'îmes', stem+'îtes', stem+'irent'],
    subjonctifPresent:   [stem+'e',   stem+'es',  stem+'e',    stem+'ions', stem+'iez',  stem+'ent'],
    imperatif:           [null,       stem+'s',   null,         stem+'ons',  stem+'ez',   null],
  };
}

// ─── Build full conjugation for one verb ─────────────────────────────────────
function buildVerb(def) {
  let base;
  if (def.group === 'er') {
    base = conjugateER(def.stem, def.infinitive);
  } else if (def.group === 'ir') {
    base = conjugateIR(def.stem, def.infinitive);
  } else if (def.group === 're') {
    base = conjugateRE(def.stem, def.infinitive);
  } else {
    base = {};
  }

  // Apply overrides (irregular forms)
  const forms = Object.assign({}, base, def.overrides || {});

  // Build compound tenses
  const aux = def.auxiliary || 'avoir';
  forms.passeCompose      = buildCompound(aux, 'present',             def.participle);
  forms.plusQueParfait    = buildCompound(aux, 'imparfait',           def.participle);
  forms.futurAnterieur    = buildCompound(aux, 'futurSimple',         def.participle);
  forms.conditionnelPasse = buildCompound(aux, 'conditionnelPresent', def.participle);

  // Present participle: nous-form of present, -ons → -ant (overridable for avoir/être/savoir)
  const nousPresent = forms.present ? forms.present[3] : null;
  forms.participePresent = def.participePresentOverride
    || (nousPresent ? nousPresent.replace(/ons$/, 'ant') : null);

  // Past participle (single invariable base form)
  forms.participePasse = def.participle;

  // Futur proche: aller (présent) + infinitif  →  "je vais parler"
  const ALLER_PRESENT = ['vais', 'vas', 'va', 'allons', 'allez', 'vont'];
  forms.futurProche = ALLER_PRESENT.map(a => a + ' ' + def.infinitive);

  // Impersonal verbs (falloir, pleuvoir) only exist in the 3rd-person singular
  if (def.impersonal) {
    ['passeCompose', 'plusQueParfait', 'futurAnterieur', 'conditionnelPasse', 'futurProche']
      .forEach(t => { forms[t] = forms[t].map((v, i) => (i === 2 ? v : null)); });
  }

  return {
    infinitive:  def.infinitive,
    english:     def.english,
    group:       def.group,
    auxiliary:   aux,
    participle:  def.participle,
    impersonal:  def.impersonal || false,
    forms,
  };
}

// ─── Verb definitions ─────────────────────────────────────────────────────────
// Regular -ER verbs ────────────────────────────────────────────────────────────
const ER_REGULAR = [
  { infinitive: 'parler',     english: 'to speak',            stem: 'parl'    },
  { infinitive: 'aimer',      english: 'to love / like',      stem: 'aim'     },
  { infinitive: 'donner',     english: 'to give',             stem: 'donn'    },
  { infinitive: 'trouver',    english: 'to find',             stem: 'trouv'   },
  { infinitive: 'penser',     english: 'to think',            stem: 'pens'    },
  { infinitive: 'regarder',   english: 'to watch / look at',  stem: 'regard'  },
  { infinitive: 'écouter',    english: 'to listen to',        stem: 'écout'   },
  { infinitive: 'chercher',   english: 'to look for',         stem: 'cherch'  },
  { infinitive: 'marcher',    english: 'to walk',             stem: 'march'   },
  { infinitive: 'rester',     english: 'to stay',             stem: 'rest',   auxiliary: 'être', participle: 'resté' },
  { infinitive: 'passer',     english: 'to pass / spend',     stem: 'pass'    },
  { infinitive: 'porter',     english: 'to carry / wear',     stem: 'port'    },
  { infinitive: 'montrer',    english: 'to show',             stem: 'montr'   },
  { infinitive: 'tomber',     english: 'to fall',             stem: 'tomb',   auxiliary: 'être', participle: 'tombé' },
  { infinitive: 'habiter',    english: 'to live / reside',    stem: 'habit'   },
  { infinitive: 'travailler', english: 'to work',             stem: 'travaill'},
  { infinitive: 'jouer',      english: 'to play',             stem: 'jou'     },
  { infinitive: 'chanter',    english: 'to sing',             stem: 'chant'   },
  { infinitive: 'danser',     english: 'to dance',            stem: 'dans'    },
  { infinitive: 'étudier',    english: 'to study',            stem: 'étudi'   },
  { infinitive: 'crier',      english: 'to shout / cry',      stem: 'cri'     },
  { infinitive: 'oublier',    english: 'to forget',           stem: 'oubli'   },
  { infinitive: 'remercier',  english: 'to thank',            stem: 'remerci' },
  { infinitive: 'créer',      english: 'to create',           stem: 'cré'     },
  { infinitive: 'présenter',  english: 'to present / introduce', stem: 'présent'},
  { infinitive: 'accepter',   english: 'to accept',           stem: 'accept'  },
  { infinitive: 'sembler',    english: 'to seem',             stem: 'sembl'   },
  { infinitive: 'garder',     english: 'to keep / guard',     stem: 'gard'    },
  { infinitive: 'laisser',    english: 'to leave / let',      stem: 'laiss'   },
  { infinitive: 'toucher',    english: 'to touch',            stem: 'touch'   },
  { infinitive: 'utiliser',   english: 'to use',              stem: 'utilis'  },
  { infinitive: 'continuer',  english: 'to continue',         stem: 'continu' },
  { infinitive: 'rencontrer', english: 'to meet',             stem: 'rencontr'},
  { infinitive: 'retourner',  english: 'to return',           stem: 'retorn',  auxiliary: 'être', participle: 'retourné',
    overrides: { present: ['retourne','retournes','retourne','retournons','retournez','retournent'], imparfait: ['retournais','retournais','retournait','retournions','retourniez','retournaient'], futurSimple: ['retournerai','retourneras','retournera','retournerons','retournerez','retourneront'], conditionnelPresent: ['retournerais','retournerais','retournerait','retournerions','retourneriez','retourneraient'], passeSimple: ['retournai','retournas','retourna','retournâmes','retournâtes','retournèrent'], subjonctifPresent: ['retourne','retournes','retourne','retournions','retourniez','retournent'], imperatif: [null,'retourne',null,'retournons','retournez',null] }
  },
  { infinitive: 'discuter',   english: 'to discuss',          stem: 'discut'  },
  { infinitive: 'visiter',    english: 'to visit',            stem: 'visit'   },
  { infinitive: 'inviter',    english: 'to invite',           stem: 'invit'   },
  { infinitive: 'tenter',     english: 'to attempt',          stem: 'tent'    },
  { infinitive: 'compter',    english: 'to count',            stem: 'compt'   },
  { infinitive: 'raconter',   english: 'to tell / narrate',   stem: 'racont'  },
  { infinitive: 'demander',   english: 'to ask',              stem: 'demand'  },
  { infinitive: 'expliquer',  english: 'to explain',          stem: 'expliqu' },
  { infinitive: 'voler',      english: 'to fly / steal',      stem: 'vol'     },
  { infinitive: 'gagner',     english: 'to win / earn',       stem: 'gagn'    },
  { infinitive: 'téléphoner', english: 'to phone',            stem: 'téléphon'},
  { infinitive: 'préparer',   english: 'to prepare',          stem: 'prépar'  },
  { infinitive: 'décider',    english: 'to decide',           stem: 'décid'   },
  { infinitive: 'dessiner',   english: 'to draw',             stem: 'dessin'  },
  { infinitive: 'fermer',     english: 'to close',            stem: 'ferm'    },
  { infinitive: 'terminer',   english: 'to finish / end',     stem: 'termin'  },
  { infinitive: 'excuser',    english: 'to excuse',           stem: 'excus'   },
  { infinitive: 'aider',      english: 'to help',             stem: 'aid'     },
  { infinitive: 'améliorer',  english: 'to improve',          stem: 'amélior' },
  { infinitive: 'noter',      english: 'to note',             stem: 'not'     },
  { infinitive: 'observer',   english: 'to observe',          stem: 'observ'  },
  { infinitive: 'pardonner',  english: 'to forgive',          stem: 'pardonn' },
  { infinitive: 'tirer',      english: 'to pull / shoot',     stem: 'tir'     },
  { infinitive: 'tourner',    english: 'to turn',             stem: 'tourn'   },
  { infinitive: 'traverser',  english: 'to cross',            stem: 'travers' },
  { infinitive: 'tromper',    english: 'to deceive',          stem: 'tromp'   },
  { infinitive: 'voter',      english: 'to vote',             stem: 'vot'     },
  { infinitive: 'exprimer',   english: 'to express',          stem: 'exprim'  },
  { infinitive: 'former',     english: 'to form / train',     stem: 'form'    },
  { infinitive: 'informer',   english: 'to inform',           stem: 'inform'  },
  { infinitive: 'transformer',english: 'to transform',        stem: 'transform'},
  { infinitive: 'confirmer',  english: 'to confirm',          stem: 'confirm' },
  { infinitive: 'durer',      english: 'to last',             stem: 'dur'     },
  { infinitive: 'briller',    english: 'to shine',            stem: 'brill'   },
  { infinitive: 'sonner',     english: 'to ring / sound',     stem: 'sonn'    },
  { infinitive: 'poser',      english: 'to put / place',      stem: 'pos'     },
  { infinitive: 'arrêter',    english: 'to stop / arrest',    stem: 'arrêt'   },
  { infinitive: 'apporter',   english: 'to bring',            stem: 'apport'  },
  { infinitive: 'approcher',  english: 'to approach',         stem: 'approch' },
  { infinitive: 'casser',     english: 'to break',            stem: 'cass'    },
  { infinitive: 'comparer',   english: 'to compare',          stem: 'compar'  },
  { infinitive: 'contrôler',  english: 'to control',          stem: 'contrôl' },
  { infinitive: 'déposer',    english: 'to deposit / drop off', stem: 'dépos' },
  { infinitive: 'exister',    english: 'to exist',            stem: 'exist'   },
  { infinitive: 'entrer',     english: 'to enter',            stem: 'entr',   auxiliary: 'être', participle: 'entré',
    overrides: { present: ['entre','entres','entre','entrons','entrez','entrent'], imparfait: ['entrais','entrais','entrait','entrions','entriez','entraient'], futurSimple: ['entrerai','entreras','entrera','entrerons','entrerez','entreront'], conditionnelPresent: ['entrerais','entrerais','entrerait','entrerions','entreriez','entreraient'], passeSimple: ['entrai','entras','entra','entrâmes','entrâtes','entrèrent'], subjonctifPresent: ['entre','entres','entre','entrions','entriez','entrent'], imperatif: [null,'entre',null,'entrons','entrez',null] }
  },
  { infinitive: 'arriver',    english: 'to arrive',           stem: 'arriv',  auxiliary: 'être', participle: 'arrivé',
    overrides: { present: ['arrive','arrives','arrive','arrivons','arrivez','arrivent'], imparfait: ['arrivais','arrivais','arrivait','arrivions','arriviez','arrivaient'], futurSimple: ['arriverai','arriveras','arrivera','arriverons','arriverez','arriveront'], conditionnelPresent: ['arriverais','arriverais','arriverait','arriverions','arriveriez','arriveraient'], passeSimple: ['arrivai','arrivas','arriva','arrivâmes','arrivâtes','arrivèrent'], subjonctifPresent: ['arrive','arrives','arrive','arrivions','arriviez','arrivent'], imperatif: [null,'arrive',null,'arrivons','arrivez',null] }
  },
  { infinitive: 'monter',     english: 'to go up / climb',    stem: 'mont',   auxiliary: 'être', participle: 'monté',
    overrides: { present: ['monte','montes','monte','montons','montez','montent'], imparfait: ['montais','montais','montait','montions','montiez','montaient'], futurSimple: ['monterai','monteras','montera','monterons','monterez','monteront'], conditionnelPresent: ['monterais','monterais','monterait','monterions','monteriez','monteraient'], passeSimple: ['montai','montas','monta','montâmes','montâtes','montèrent'], subjonctifPresent: ['monte','montes','monte','montions','montiez','montent'], imperatif: [null,'monte',null,'montons','montez',null] }
  },
].map(d => ({ ...d, group: 'er', participle: d.participle || (d.stem + 'é'), auxiliary: d.auxiliary || 'avoir' }));

// Spelling-change -ER verbs ────────────────────────────────────────────────────
const ER_SPELLING = [
  {
    infinitive: 'manger', english: 'to eat',
    participle: 'mangé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['mange','manges','mange','mangeons','mangez','mangent'],
      imparfait:           ['mangeais','mangeais','mangeait','mangions','mangiez','mangeaient'],
      futurSimple:         ['mangerai','mangeras','mangera','mangerons','mangerez','mangeront'],
      conditionnelPresent: ['mangerais','mangerais','mangerait','mangerions','mangeriez','mangeraient'],
      passeSimple:         ['mangeai','mangeas','mangea','mangeâmes','mangeâtes','mangèrent'],
      subjonctifPresent:   ['mange','manges','mange','mangions','mangiez','mangent'],
      imperatif:           [null,'mange',null,'mangeons','mangez',null],
    },
  },
  {
    infinitive: 'commencer', english: 'to begin',
    participle: 'commencé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['commence','commences','commence','commençons','commencez','commencent'],
      imparfait:           ['commençais','commençais','commençait','commencions','commenciez','commençaient'],
      futurSimple:         ['commencerai','commenceras','commencera','commencerons','commencerez','commenceront'],
      conditionnelPresent: ['commencerais','commencerais','commencerait','commencerions','commenceriez','commenceraient'],
      passeSimple:         ['commençai','commenças','commença','commençâmes','commençâtes','commencèrent'],
      subjonctifPresent:   ['commence','commences','commence','commencions','commenciez','commencent'],
      imperatif:           [null,'commence',null,'commençons','commencez',null],
    },
  },
  {
    infinitive: 'changer', english: 'to change',
    participle: 'changé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['change','changes','change','changeons','changez','changent'],
      imparfait:           ['changeais','changeais','changeait','changions','changiez','changeaient'],
      futurSimple:         ['changerai','changeras','changera','changerons','changerez','changeront'],
      conditionnelPresent: ['changerais','changerais','changerait','changerions','changeriez','changeraient'],
      passeSimple:         ['changeai','changeas','changea','changeâmes','changeâtes','changèrent'],
      subjonctifPresent:   ['change','changes','change','changions','changiez','changent'],
      imperatif:           [null,'change',null,'changeons','changez',null],
    },
  },
  {
    infinitive: 'voyager', english: 'to travel',
    participle: 'voyagé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['voyage','voyages','voyage','voyageons','voyagez','voyagent'],
      imparfait:           ['voyageais','voyageais','voyageait','voyagions','voyagiez','voyageaient'],
      futurSimple:         ['voyagerai','voyageras','voyagera','voyagerons','voyagerez','voyageront'],
      conditionnelPresent: ['voyagerais','voyagerais','voyagerait','voyagerions','voyageriez','voyageraient'],
      passeSimple:         ['voyageai','voyageas','voyagea','voyageâmes','voyageâtes','voyagèrent'],
      subjonctifPresent:   ['voyage','voyages','voyage','voyagions','voyagiez','voyagent'],
      imperatif:           [null,'voyage',null,'voyageons','voyagez',null],
    },
  },
  {
    infinitive: 'appeler', english: 'to call',
    participle: 'appelé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['appelle','appelles','appelle','appelons','appelez','appellent'],
      imparfait:           ['appelais','appelais','appelait','appelions','appeliez','appelaient'],
      futurSimple:         ['appellerai','appelleras','appellera','appellerons','appellerez','appelleront'],
      conditionnelPresent: ['appellerais','appellerais','appellerait','appellerions','appelleriez','appelleraient'],
      passeSimple:         ['appelai','appelas','appela','appelâmes','appelâtes','appelèrent'],
      subjonctifPresent:   ['appelle','appelles','appelle','appelions','appeliez','appellent'],
      imperatif:           [null,'appelle',null,'appelons','appelez',null],
    },
  },
  {
    infinitive: 'jeter', english: 'to throw',
    participle: 'jeté', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['jette','jettes','jette','jetons','jetez','jettent'],
      imparfait:           ['jetais','jetais','jetait','jetions','jetiez','jetaient'],
      futurSimple:         ['jetterai','jetteras','jettera','jetterons','jetterez','jetteront'],
      conditionnelPresent: ['jetterais','jetterais','jetterait','jetterions','jetteriez','jetteraient'],
      passeSimple:         ['jetai','jetas','jeta','jetâmes','jetâtes','jetèrent'],
      subjonctifPresent:   ['jette','jettes','jette','jetions','jetiez','jettent'],
      imperatif:           [null,'jette',null,'jetons','jetez',null],
    },
  },
  {
    infinitive: 'acheter', english: 'to buy',
    participle: 'acheté', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['achète','achètes','achète','achetons','achetez','achètent'],
      imparfait:           ['achetais','achetais','achetait','achetions','achetiez','achetaient'],
      futurSimple:         ['achèterai','achèteras','achètera','achèterons','achèterez','achèteront'],
      conditionnelPresent: ['achèterais','achèterais','achèterait','achèterions','achèteriez','achèteraient'],
      passeSimple:         ['achetai','achetas','acheta','achetâmes','achetâtes','achetèrent'],
      subjonctifPresent:   ['achète','achètes','achète','achetions','achetiez','achètent'],
      imperatif:           [null,'achète',null,'achetons','achetez',null],
    },
  },
  {
    infinitive: 'lever', english: 'to lift / raise',
    participle: 'levé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['lève','lèves','lève','levons','levez','lèvent'],
      imparfait:           ['levais','levais','levait','levions','leviez','levaient'],
      futurSimple:         ['lèverai','lèveras','lèvera','lèverons','lèverez','lèveront'],
      conditionnelPresent: ['lèverais','lèverais','lèverait','lèverions','lèveriez','lèveraient'],
      passeSimple:         ['levai','levas','leva','levâmes','levâtes','levèrent'],
      subjonctifPresent:   ['lève','lèves','lève','levions','leviez','lèvent'],
      imperatif:           [null,'lève',null,'levons','levez',null],
    },
  },
  {
    infinitive: 'espérer', english: 'to hope',
    participle: 'espéré', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['espère','espères','espère','espérons','espérez','espèrent'],
      imparfait:           ['espérais','espérais','espérait','espérions','espériez','espéraient'],
      futurSimple:         ['espérerai','espéreras','espérera','espérerons','espérerez','espéreront'],
      conditionnelPresent: ['espérerais','espérerais','espérerait','espérerions','espéreriez','espéreraient'],
      passeSimple:         ['espérai','espéras','espéra','espérâmes','espérâtes','espérèrent'],
      subjonctifPresent:   ['espère','espères','espère','espérions','espériez','espèrent'],
      imperatif:           [null,'espère',null,'espérons','espérez',null],
    },
  },
  {
    infinitive: 'préférer', english: 'to prefer',
    participle: 'préféré', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['préfère','préfères','préfère','préférons','préférez','préfèrent'],
      imparfait:           ['préférais','préférais','préférait','préférions','préfériez','préféraient'],
      futurSimple:         ['préférerai','préféreras','préférera','préférerons','préférerez','préféreront'],
      conditionnelPresent: ['préférerais','préférerais','préférerait','préférerions','préféreriez','préféreraient'],
      passeSimple:         ['préférai','préféras','préféra','préférâmes','préférâtes','préférèrent'],
      subjonctifPresent:   ['préfère','préfères','préfère','préférions','préfériez','préfèrent'],
      imperatif:           [null,'préfère',null,'préférons','préférez',null],
    },
  },
  {
    infinitive: 'essayer', english: 'to try',
    participle: 'essayé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['essaie','essaies','essaie','essayons','essayez','essaient'],
      imparfait:           ['essayais','essayais','essayait','essayions','essayiez','essayaient'],
      futurSimple:         ['essaierai','essaieras','essaiera','essaierons','essaierez','essaieront'],
      conditionnelPresent: ['essaierais','essaierais','essaierait','essaierions','essaieriez','essaieraient'],
      passeSimple:         ['essayai','essayas','essaya','essayâmes','essayâtes','essayèrent'],
      subjonctifPresent:   ['essaie','essaies','essaie','essayions','essayiez','essaient'],
      imperatif:           [null,'essaie',null,'essayons','essayez',null],
    },
  },
  {
    infinitive: 'payer', english: 'to pay',
    participle: 'payé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['paie','paies','paie','payons','payez','paient'],
      imparfait:           ['payais','payais','payait','payions','payiez','payaient'],
      futurSimple:         ['paierai','paieras','paiera','paierons','paierez','paieront'],
      conditionnelPresent: ['paierais','paierais','paierait','paierions','paieriez','paieraient'],
      passeSimple:         ['payai','payas','paya','payâmes','payâtes','payèrent'],
      subjonctifPresent:   ['paie','paies','paie','payions','payiez','paient'],
      imperatif:           [null,'paie',null,'payons','payez',null],
    },
  },
  {
    infinitive: 'nettoyer', english: 'to clean',
    participle: 'nettoyé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['nettoie','nettoies','nettoie','nettoyons','nettoyez','nettoient'],
      imparfait:           ['nettoyais','nettoyais','nettoyait','nettoyions','nettoyiez','nettoyaient'],
      futurSimple:         ['nettoierai','nettoieras','nettoiera','nettoierons','nettoierez','nettoieront'],
      conditionnelPresent: ['nettoierais','nettoierais','nettoierait','nettoierions','nettoieriez','nettoieraient'],
      passeSimple:         ['nettoyai','nettoyas','nettoya','nettoyâmes','nettoyâtes','nettoyèrent'],
      subjonctifPresent:   ['nettoie','nettoies','nettoie','nettoyions','nettoyiez','nettoient'],
      imperatif:           [null,'nettoie',null,'nettoyons','nettoyez',null],
    },
  },
  {
    infinitive: 'employer', english: 'to use / employ',
    participle: 'employé', auxiliary: 'avoir', group: 'er',
    overrides: {
      present:             ['emploie','emploies','emploie','employons','employez','emploient'],
      imparfait:           ['employais','employais','employait','employions','employiez','employaient'],
      futurSimple:         ['emploierai','emploieras','emploiera','emploierons','emploierez','emploieront'],
      conditionnelPresent: ['emploierais','emploierais','emploierait','emploierions','emploieriez','emploieraient'],
      passeSimple:         ['employai','employas','employa','employâmes','employâtes','employèrent'],
      subjonctifPresent:   ['emploie','emploies','emploie','employions','employiez','emploient'],
      imperatif:           [null,'emploie',null,'employons','employez',null],
    },
  },
];

// Regular -IR verbs (finir type) ──────────────────────────────────────────────
const IR_REGULAR = [
  { infinitive: 'finir',       english: 'to finish',           stem: 'fin'      },
  { infinitive: 'choisir',     english: 'to choose',           stem: 'chois'    },
  { infinitive: 'agir',        english: 'to act',              stem: 'ag'       },
  { infinitive: 'remplir',     english: 'to fill',             stem: 'rempl'    },
  { infinitive: 'grandir',     english: 'to grow up',          stem: 'grand'    },
  { infinitive: 'bâtir',       english: 'to build',            stem: 'bât'      },
  { infinitive: 'obéir',       english: 'to obey',             stem: 'obé'      },
  { infinitive: 'réussir',     english: 'to succeed',          stem: 'réuss'    },
  { infinitive: 'saisir',      english: 'to seize / grab',     stem: 'sais'     },
  { infinitive: 'définir',     english: 'to define',           stem: 'défin'    },
  { infinitive: 'établir',     english: 'to establish',        stem: 'établ'    },
  { infinitive: 'fournir',     english: 'to provide',          stem: 'fourn'    },
  { infinitive: 'garantir',    english: 'to guarantee',        stem: 'garant'   },
  { infinitive: 'guérir',      english: 'to cure / heal',      stem: 'guér'     },
  { infinitive: 'maigrir',     english: 'to lose weight',      stem: 'maigr'    },
  { infinitive: 'nourrir',     english: 'to feed / nourish',   stem: 'nourr'    },
  { infinitive: 'punir',       english: 'to punish',           stem: 'pun'      },
  { infinitive: 'réfléchir',   english: 'to reflect / think',  stem: 'réfléch'  },
  { infinitive: 'rougir',      english: 'to blush / redden',   stem: 'roug'     },
  { infinitive: 'subir',       english: 'to undergo',          stem: 'sub'      },
  { infinitive: 'vieillir',    english: 'to grow old',         stem: 'vieill'   },
  { infinitive: 'applaudir',   english: 'to applaud',          stem: 'applaud'  },
  { infinitive: 'avertir',     english: 'to warn',             stem: 'avert'    },
  { infinitive: 'embellir',    english: 'to beautify',         stem: 'embell'   },
  { infinitive: 'enrichir',    english: 'to enrich',           stem: 'enrich'   },
  { infinitive: 'investir',    english: 'to invest',           stem: 'invest'   },
  { infinitive: 'ralentir',    english: 'to slow down',        stem: 'ralent'   },
  { infinitive: 'réunir',      english: 'to gather / unite',   stem: 'réun'     },
  { infinitive: 'fleurir',     english: 'to bloom',            stem: 'fleur'    },
  { infinitive: 'atterrir',    english: 'to land',             stem: 'atterr'   },
].map(d => ({ ...d, group: 'ir', participle: d.infinitive.replace('ir','i'), auxiliary: 'avoir' }));

// Regular -RE verbs ────────────────────────────────────────────────────────────
const RE_REGULAR = [
  { infinitive: 'vendre',      english: 'to sell',             stem: 'vend'     },
  { infinitive: 'attendre',    english: 'to wait (for)',        stem: 'attend'   },
  { infinitive: 'répondre',    english: 'to answer',           stem: 'répond'   },
  { infinitive: 'entendre',    english: 'to hear',             stem: 'entend'   },
  { infinitive: 'perdre',      english: 'to lose',             stem: 'perd'     },
  { infinitive: 'descendre',   english: 'to go down',          stem: 'descend', auxiliary: 'être',  participle: 'descendu' },
  { infinitive: 'défendre',    english: 'to defend',           stem: 'défend'   },
  { infinitive: 'rendre',      english: 'to give back',        stem: 'rend'     },
  { infinitive: 'tendre',      english: 'to hold out / stretch', stem: 'tend'   },
  { infinitive: 'étendre',     english: 'to extend / spread',  stem: 'étend'    },
  { infinitive: 'correspondre',english: 'to correspond',       stem: 'correspond'},
  { infinitive: 'confondre',   english: 'to confuse',          stem: 'confond'  },
  { infinitive: 'fondre',      english: 'to melt',             stem: 'fond'     },
  { infinitive: 'dépendre',    english: 'to depend',           stem: 'dépend'   },
  { infinitive: 'suspendre',   english: 'to suspend',          stem: 'suspend'  },
  { infinitive: 'répandre',    english: 'to spread / spill',   stem: 'répand'   },
  { infinitive: 'mordre',      english: 'to bite',             stem: 'mord'     },
  { infinitive: 'tordre',      english: 'to twist',            stem: 'tord'     },
  { infinitive: 'prétendre',   english: 'to claim',            stem: 'prétend'  },
  { infinitive: 'détendre',    english: 'to relax',            stem: 'détend'   },
].map(d => ({ ...d, group: 're', participle: d.participle || (d.stem + 'u'), auxiliary: d.auxiliary || 'avoir' }));

// Irregular verbs ─────────────────────────────────────────────────────────────
const IRREGULAR = [
  {
    infinitive: 'être', english: 'to be',
    group: 'irregular', auxiliary: 'avoir', participle: 'été',
    participePresentOverride: 'étant',
    overrides: {
      present:             ['suis','es','est','sommes','êtes','sont'],
      imparfait:           ['étais','étais','était','étions','étiez','étaient'],
      futurSimple:         ['serai','seras','sera','serons','serez','seront'],
      conditionnelPresent: ['serais','serais','serait','serions','seriez','seraient'],
      passeSimple:         ['fus','fus','fut','fûmes','fûtes','furent'],
      subjonctifPresent:   ['sois','sois','soit','soyons','soyez','soient'],
      imperatif:           [null,'sois',null,'soyons','soyez',null],
    },
  },
  {
    infinitive: 'avoir', english: 'to have',
    group: 'irregular', auxiliary: 'avoir', participle: 'eu',
    participePresentOverride: 'ayant',
    overrides: {
      present:             ['ai','as','a','avons','avez','ont'],
      imparfait:           ['avais','avais','avait','avions','aviez','avaient'],
      futurSimple:         ['aurai','auras','aura','aurons','aurez','auront'],
      conditionnelPresent: ['aurais','aurais','aurait','aurions','auriez','auraient'],
      passeSimple:         ['eus','eus','eut','eûmes','eûtes','eurent'],
      subjonctifPresent:   ['aie','aies','ait','ayons','ayez','aient'],
      imperatif:           [null,'aie',null,'ayons','ayez',null],
    },
  },
  {
    infinitive: 'aller', english: 'to go',
    group: 'irregular', auxiliary: 'être', participle: 'allé',
    overrides: {
      present:             ['vais','vas','va','allons','allez','vont'],
      imparfait:           ['allais','allais','allait','allions','alliez','allaient'],
      futurSimple:         ['irai','iras','ira','irons','irez','iront'],
      conditionnelPresent: ['irais','irais','irait','irions','iriez','iraient'],
      passeSimple:         ['allai','allas','alla','allâmes','allâtes','allèrent'],
      subjonctifPresent:   ['aille','ailles','aille','allions','alliez','aillent'],
      imperatif:           [null,'va',null,'allons','allez',null],
    },
  },
  {
    infinitive: 'faire', english: 'to do / make',
    group: 'irregular', auxiliary: 'avoir', participle: 'fait',
    overrides: {
      present:             ['fais','fais','fait','faisons','faites','font'],
      imparfait:           ['faisais','faisais','faisait','faisions','faisiez','faisaient'],
      futurSimple:         ['ferai','feras','fera','ferons','ferez','feront'],
      conditionnelPresent: ['ferais','ferais','ferait','ferions','feriez','feraient'],
      passeSimple:         ['fis','fis','fit','fîmes','fîtes','firent'],
      subjonctifPresent:   ['fasse','fasses','fasse','fassions','fassiez','fassent'],
      imperatif:           [null,'fais',null,'faisons','faites',null],
    },
  },
  {
    infinitive: 'dire', english: 'to say / tell',
    group: 'irregular', auxiliary: 'avoir', participle: 'dit',
    overrides: {
      present:             ['dis','dis','dit','disons','dites','disent'],
      imparfait:           ['disais','disais','disait','disions','disiez','disaient'],
      futurSimple:         ['dirai','diras','dira','dirons','direz','diront'],
      conditionnelPresent: ['dirais','dirais','dirait','dirions','diriez','diraient'],
      passeSimple:         ['dis','dis','dit','dîmes','dîtes','dirent'],
      subjonctifPresent:   ['dise','dises','dise','disions','disiez','disent'],
      imperatif:           [null,'dis',null,'disons','dites',null],
    },
  },
  {
    infinitive: 'pouvoir', english: 'to be able to / can',
    group: 'irregular', auxiliary: 'avoir', participle: 'pu',
    overrides: {
      present:             ['peux','peux','peut','pouvons','pouvez','peuvent'],
      imparfait:           ['pouvais','pouvais','pouvait','pouvions','pouviez','pouvaient'],
      futurSimple:         ['pourrai','pourras','pourra','pourrons','pourrez','pourront'],
      conditionnelPresent: ['pourrais','pourrais','pourrait','pourrions','pourriez','pourraient'],
      passeSimple:         ['pus','pus','put','pûmes','pûtes','purent'],
      subjonctifPresent:   ['puisse','puisses','puisse','puissions','puissiez','puissent'],
      imperatif:           [null,null,null,null,null,null],
    },
  },
  {
    infinitive: 'vouloir', english: 'to want',
    group: 'irregular', auxiliary: 'avoir', participle: 'voulu',
    overrides: {
      present:             ['veux','veux','veut','voulons','voulez','veulent'],
      imparfait:           ['voulais','voulais','voulait','voulions','vouliez','voulaient'],
      futurSimple:         ['voudrai','voudras','voudra','voudrons','voudrez','voudront'],
      conditionnelPresent: ['voudrais','voudrais','voudrait','voudrions','voudriez','voudraient'],
      passeSimple:         ['voulus','voulus','voulut','voulûmes','voulûtes','voulurent'],
      subjonctifPresent:   ['veuille','veuilles','veuille','voulions','vouliez','veuillent'],
      imperatif:           [null,'veuille',null,'veuillons','veuillez',null],
    },
  },
  {
    infinitive: 'savoir', english: 'to know (a fact)',
    group: 'irregular', auxiliary: 'avoir', participle: 'su',
    participePresentOverride: 'sachant',
    overrides: {
      present:             ['sais','sais','sait','savons','savez','savent'],
      imparfait:           ['savais','savais','savait','savions','saviez','savaient'],
      futurSimple:         ['saurai','sauras','saura','saurons','saurez','sauront'],
      conditionnelPresent: ['saurais','saurais','saurait','saurions','sauriez','sauraient'],
      passeSimple:         ['sus','sus','sut','sûmes','sûtes','surent'],
      subjonctifPresent:   ['sache','saches','sache','sachions','sachiez','sachent'],
      imperatif:           [null,'sache',null,'sachons','sachez',null],
    },
  },
  {
    infinitive: 'venir', english: 'to come',
    group: 'irregular', auxiliary: 'être', participle: 'venu',
    overrides: {
      present:             ['viens','viens','vient','venons','venez','viennent'],
      imparfait:           ['venais','venais','venait','venions','veniez','venaient'],
      futurSimple:         ['viendrai','viendras','viendra','viendrons','viendrez','viendront'],
      conditionnelPresent: ['viendrais','viendrais','viendrait','viendrions','viendriez','viendraient'],
      passeSimple:         ['vins','vins','vint','vînmes','vîntes','vinrent'],
      subjonctifPresent:   ['vienne','viennes','vienne','venions','veniez','viennent'],
      imperatif:           [null,'viens',null,'venons','venez',null],
    },
  },
  {
    infinitive: 'voir', english: 'to see',
    group: 'irregular', auxiliary: 'avoir', participle: 'vu',
    overrides: {
      present:             ['vois','vois','voit','voyons','voyez','voient'],
      imparfait:           ['voyais','voyais','voyait','voyions','voyiez','voyaient'],
      futurSimple:         ['verrai','verras','verra','verrons','verrez','verront'],
      conditionnelPresent: ['verrais','verrais','verrait','verrions','verriez','verraient'],
      passeSimple:         ['vis','vis','vit','vîmes','vîtes','virent'],
      subjonctifPresent:   ['voie','voies','voie','voyions','voyiez','voient'],
      imperatif:           [null,'vois',null,'voyons','voyez',null],
    },
  },
  {
    infinitive: 'partir', english: 'to leave',
    group: 'irregular', auxiliary: 'être', participle: 'parti',
    overrides: {
      present:             ['pars','pars','part','partons','partez','partent'],
      imparfait:           ['partais','partais','partait','partions','partiez','partaient'],
      futurSimple:         ['partirai','partiras','partira','partirons','partirez','partiront'],
      conditionnelPresent: ['partirais','partirais','partirait','partirions','partiriez','partiraient'],
      passeSimple:         ['partis','partis','partit','partîmes','partîtes','partirent'],
      subjonctifPresent:   ['parte','partes','parte','partions','partiez','partent'],
      imperatif:           [null,'pars',null,'partons','partez',null],
    },
  },
  {
    infinitive: 'prendre', english: 'to take',
    group: 'irregular', auxiliary: 'avoir', participle: 'pris',
    overrides: {
      present:             ['prends','prends','prend','prenons','prenez','prennent'],
      imparfait:           ['prenais','prenais','prenait','prenions','preniez','prenaient'],
      futurSimple:         ['prendrai','prendras','prendra','prendrons','prendrez','prendront'],
      conditionnelPresent: ['prendrais','prendrais','prendrait','prendrions','prendriez','prendraient'],
      passeSimple:         ['pris','pris','prit','prîmes','prîtes','prirent'],
      subjonctifPresent:   ['prenne','prennes','prenne','prenions','preniez','prennent'],
      imperatif:           [null,'prends',null,'prenons','prenez',null],
    },
  },
  {
    infinitive: 'mettre', english: 'to put',
    group: 'irregular', auxiliary: 'avoir', participle: 'mis',
    overrides: {
      present:             ['mets','mets','met','mettons','mettez','mettent'],
      imparfait:           ['mettais','mettais','mettait','mettions','mettiez','mettaient'],
      futurSimple:         ['mettrai','mettras','mettra','mettrons','mettrez','mettront'],
      conditionnelPresent: ['mettrais','mettrais','mettrait','mettrions','mettriez','mettraient'],
      passeSimple:         ['mis','mis','mit','mîmes','mîtes','mirent'],
      subjonctifPresent:   ['mette','mettes','mette','mettions','mettiez','mettent'],
      imperatif:           [null,'mets',null,'mettons','mettez',null],
    },
  },
  {
    infinitive: 'tenir', english: 'to hold',
    group: 'irregular', auxiliary: 'avoir', participle: 'tenu',
    overrides: {
      present:             ['tiens','tiens','tient','tenons','tenez','tiennent'],
      imparfait:           ['tenais','tenais','tenait','tenions','teniez','tenaient'],
      futurSimple:         ['tiendrai','tiendras','tiendra','tiendrons','tiendrez','tiendront'],
      conditionnelPresent: ['tiendrais','tiendrais','tiendrait','tiendrions','tiendriez','tiendraient'],
      passeSimple:         ['tins','tins','tint','tînmes','tîntes','tinrent'],
      subjonctifPresent:   ['tienne','tiennes','tienne','tenions','teniez','tiennent'],
      imperatif:           [null,'tiens',null,'tenons','tenez',null],
    },
  },
  {
    infinitive: 'connaître', english: 'to know (a person/place)',
    group: 'irregular', auxiliary: 'avoir', participle: 'connu',
    overrides: {
      present:             ['connais','connais','connaît','connaissons','connaissez','connaissent'],
      imparfait:           ['connaissais','connaissais','connaissait','connaissions','connaissiez','connaissaient'],
      futurSimple:         ['connaîtrai','connaîtras','connaîtra','connaîtrons','connaîtrez','connaîtront'],
      conditionnelPresent: ['connaîtrais','connaîtrais','connaîtrait','connaîtrions','connaîtriez','connaîtraient'],
      passeSimple:         ['connus','connus','connut','connûmes','connûtes','connurent'],
      subjonctifPresent:   ['connaisse','connaisses','connaisse','connaissions','connaissiez','connaissent'],
      imperatif:           [null,'connais',null,'connaissons','connaissez',null],
    },
  },
  {
    infinitive: 'naître', english: 'to be born',
    group: 'irregular', auxiliary: 'être', participle: 'né',
    overrides: {
      present:             ['nais','nais','naît','naissons','naissez','naissent'],
      imparfait:           ['naissais','naissais','naissait','naissions','naissiez','naissaient'],
      futurSimple:         ['naîtrai','naîtras','naîtra','naîtrons','naîtrez','naîtront'],
      conditionnelPresent: ['naîtrais','naîtrais','naîtrait','naîtrions','naîtriez','naîtraient'],
      passeSimple:         ['naquis','naquis','naquit','naquîmes','naquîtes','naquirent'],
      subjonctifPresent:   ['naisse','naisses','naisse','naissions','naissiez','naissent'],
      imperatif:           [null,'nais',null,'naissons','naissez',null],
    },
  },
  {
    infinitive: 'mourir', english: 'to die',
    group: 'irregular', auxiliary: 'être', participle: 'mort',
    overrides: {
      present:             ['meurs','meurs','meurt','mourons','mourez','meurent'],
      imparfait:           ['mourais','mourais','mourait','mourions','mouriez','mouraient'],
      futurSimple:         ['mourrai','mourras','mourra','mourrons','mourrez','mourront'],
      conditionnelPresent: ['mourrais','mourrais','mourrait','mourrions','mourriez','mourraient'],
      passeSimple:         ['mourus','mourus','mourut','mourûmes','mourûtes','moururent'],
      subjonctifPresent:   ['meure','meures','meure','mourions','mouriez','meurent'],
      imperatif:           [null,'meurs',null,'mourons','mourez',null],
    },
  },
  {
    infinitive: 'courir', english: 'to run',
    group: 'irregular', auxiliary: 'avoir', participle: 'couru',
    overrides: {
      present:             ['cours','cours','court','courons','courez','courent'],
      imparfait:           ['courais','courais','courait','courions','couriez','couraient'],
      futurSimple:         ['courrai','courras','courra','courrons','courrez','courront'],
      conditionnelPresent: ['courrais','courrais','courrait','courrions','courriez','courraient'],
      passeSimple:         ['courus','courus','courut','courûmes','courûtes','coururent'],
      subjonctifPresent:   ['coure','coures','coure','courions','couriez','courent'],
      imperatif:           [null,'cours',null,'courons','courez',null],
    },
  },
  {
    infinitive: 'conduire', english: 'to drive',
    group: 'irregular', auxiliary: 'avoir', participle: 'conduit',
    overrides: {
      present:             ['conduis','conduis','conduit','conduisons','conduisez','conduisent'],
      imparfait:           ['conduisais','conduisais','conduisait','conduisions','conduisiez','conduisaient'],
      futurSimple:         ['conduirai','conduiras','conduira','conduirons','conduirez','conduiront'],
      conditionnelPresent: ['conduirais','conduirais','conduirait','conduirions','conduiriez','conduiraient'],
      passeSimple:         ['conduisis','conduisis','conduisit','conduisîmes','conduisîtes','conduisirent'],
      subjonctifPresent:   ['conduise','conduises','conduise','conduisions','conduisiez','conduisent'],
      imperatif:           [null,'conduis',null,'conduisons','conduisez',null],
    },
  },
  {
    infinitive: 'lire', english: 'to read',
    group: 'irregular', auxiliary: 'avoir', participle: 'lu',
    overrides: {
      present:             ['lis','lis','lit','lisons','lisez','lisent'],
      imparfait:           ['lisais','lisais','lisait','lisions','lisiez','lisaient'],
      futurSimple:         ['lirai','liras','lira','lirons','lirez','liront'],
      conditionnelPresent: ['lirais','lirais','lirait','lirions','liriez','liraient'],
      passeSimple:         ['lus','lus','lut','lûmes','lûtes','lurent'],
      subjonctifPresent:   ['lise','lises','lise','lisions','lisiez','lisent'],
      imperatif:           [null,'lis',null,'lisons','lisez',null],
    },
  },
  {
    infinitive: 'écrire', english: 'to write',
    group: 'irregular', auxiliary: 'avoir', participle: 'écrit',
    overrides: {
      present:             ['écris','écris','écrit','écrivons','écrivez','écrivent'],
      imparfait:           ['écrivais','écrivais','écrivait','écrivions','écriviez','écrivaient'],
      futurSimple:         ['écrirai','écriras','écrira','écrirons','écrirez','écriront'],
      conditionnelPresent: ['écrirais','écrirais','écrirait','écririons','écririez','écriraient'],
      passeSimple:         ['écrivis','écrivis','écrivit','écrivîmes','écrivîtes','écrivirent'],
      subjonctifPresent:   ['écrive','écrives','écrive','écrivions','écriviez','écrivent'],
      imperatif:           [null,'écris',null,'écrivons','écrivez',null],
    },
  },
  {
    infinitive: 'vivre', english: 'to live',
    group: 'irregular', auxiliary: 'avoir', participle: 'vécu',
    overrides: {
      present:             ['vis','vis','vit','vivons','vivez','vivent'],
      imparfait:           ['vivais','vivais','vivait','vivions','viviez','vivaient'],
      futurSimple:         ['vivrai','vivras','vivra','vivrons','vivrez','vivront'],
      conditionnelPresent: ['vivrais','vivrais','vivrait','vivrions','vivriez','vivraient'],
      passeSimple:         ['vécus','vécus','vécut','vécûmes','vécûtes','vécurent'],
      subjonctifPresent:   ['vive','vives','vive','vivions','viviez','vivent'],
      imperatif:           [null,'vis',null,'vivons','vivez',null],
    },
  },
  {
    infinitive: 'suivre', english: 'to follow',
    group: 'irregular', auxiliary: 'avoir', participle: 'suivi',
    overrides: {
      present:             ['suis','suis','suit','suivons','suivez','suivent'],
      imparfait:           ['suivais','suivais','suivait','suivions','suiviez','suivaient'],
      futurSimple:         ['suivrai','suivras','suivra','suivrons','suivrez','suivront'],
      conditionnelPresent: ['suivrais','suivrais','suivrait','suivrions','suivriez','suivraient'],
      passeSimple:         ['suivis','suivis','suivit','suivîmes','suivîtes','suivirent'],
      subjonctifPresent:   ['suive','suives','suive','suivions','suiviez','suivent'],
      imperatif:           [null,'suis',null,'suivons','suivez',null],
    },
  },
  {
    infinitive: 'ouvrir', english: 'to open',
    group: 'irregular', auxiliary: 'avoir', participle: 'ouvert',
    overrides: {
      present:             ['ouvre','ouvres','ouvre','ouvrons','ouvrez','ouvrent'],
      imparfait:           ['ouvrais','ouvrais','ouvrait','ouvrions','ouvriez','ouvraient'],
      futurSimple:         ['ouvrirai','ouvriras','ouvrira','ouvrirons','ouvrirez','ouvriront'],
      conditionnelPresent: ['ouvrirais','ouvrirais','ouvrirait','ouvririons','ouvririez','ouvriraient'],
      passeSimple:         ['ouvris','ouvris','ouvrit','ouvrîmes','ouvrîtes','ouvrirent'],
      subjonctifPresent:   ['ouvre','ouvres','ouvre','ouvrions','ouvriez','ouvrent'],
      imperatif:           [null,'ouvre',null,'ouvrons','ouvrez',null],
    },
  },
  {
    infinitive: 'offrir', english: 'to offer',
    group: 'irregular', auxiliary: 'avoir', participle: 'offert',
    overrides: {
      present:             ['offre','offres','offre','offrons','offrez','offrent'],
      imparfait:           ['offrais','offrais','offrait','offrions','offriez','offraient'],
      futurSimple:         ['offrirai','offriras','offrira','offrirons','offrirez','offriront'],
      conditionnelPresent: ['offrirais','offrirais','offrirait','offririons','offririez','offriraient'],
      passeSimple:         ['offris','offris','offrit','offrîmes','offrîtes','offrirent'],
      subjonctifPresent:   ['offre','offres','offre','offrions','offriez','offrent'],
      imperatif:           [null,'offre',null,'offrons','offrez',null],
    },
  },
  {
    infinitive: 'souffrir', english: 'to suffer',
    group: 'irregular', auxiliary: 'avoir', participle: 'souffert',
    overrides: {
      present:             ['souffre','souffres','souffre','souffrons','souffrez','souffrent'],
      imparfait:           ['souffrais','souffrais','souffrait','souffrions','souffriez','souffraient'],
      futurSimple:         ['souffrirai','souffriras','souffrira','souffrirons','souffrirez','souffriront'],
      conditionnelPresent: ['souffrirais','souffrirais','souffrirait','souffririons','souffririez','souffriraient'],
      passeSimple:         ['souffris','souffris','souffrit','souffrîmes','souffrîtes','souffrirent'],
      subjonctifPresent:   ['souffre','souffres','souffre','souffrions','souffriez','souffrent'],
      imperatif:           [null,'souffre',null,'souffrons','souffrez',null],
    },
  },
  {
    infinitive: 'couvrir', english: 'to cover',
    group: 'irregular', auxiliary: 'avoir', participle: 'couvert',
    overrides: {
      present:             ['couvre','couvres','couvre','couvrons','couvrez','couvrent'],
      imparfait:           ['couvrais','couvrais','couvrait','couvrions','couvriez','couvraient'],
      futurSimple:         ['couvrirai','couvriras','couvrira','couvrirons','couvrirez','couvriront'],
      conditionnelPresent: ['couvririais','couvririais','couvrirait','couvririons','couvririez','couvriraient'],
      passeSimple:         ['couvris','couvris','couvrit','couvrîmes','couvrîtes','couvrirent'],
      subjonctifPresent:   ['couvre','couvres','couvre','couvrions','couvriez','couvrent'],
      imperatif:           [null,'couvre',null,'couvrons','couvrez',null],
    },
  },
  {
    infinitive: 'découvrir', english: 'to discover',
    group: 'irregular', auxiliary: 'avoir', participle: 'découvert',
    overrides: {
      present:             ['découvre','découvres','découvre','découvrons','découvrez','découvrent'],
      imparfait:           ['découvrais','découvrais','découvrait','découvrions','découvriez','découvraient'],
      futurSimple:         ['découvrirai','découvriras','découvrira','découvrirons','découvrirez','découvriront'],
      conditionnelPresent: ['découvrirais','découvrirais','découvrirait','découvririons','découvririez','découvriraient'],
      passeSimple:         ['découvris','découvris','découvrit','découvrîmes','découvrîtes','découvrirent'],
      subjonctifPresent:   ['découvre','découvres','découvre','découvrions','découvriez','découvrent'],
      imperatif:           [null,'découvre',null,'découvrons','découvrez',null],
    },
  },
  {
    infinitive: 'joindre', english: 'to join',
    group: 'irregular', auxiliary: 'avoir', participle: 'joint',
    overrides: {
      present:             ['joins','joins','joint','joignons','joignez','joignent'],
      imparfait:           ['joignais','joignais','joignait','joignions','joigniez','joignaient'],
      futurSimple:         ['joindrai','joindras','joindra','joindrons','joindrez','joindront'],
      conditionnelPresent: ['joindrais','joindrais','joindrait','joindrions','joindriez','joindraient'],
      passeSimple:         ['joignis','joignis','joignit','joignîmes','joignîtes','joignirent'],
      subjonctifPresent:   ['joigne','joignes','joigne','joignions','joigniez','joignent'],
      imperatif:           [null,'joins',null,'joignons','joignez',null],
    },
  },
  {
    infinitive: 'craindre', english: 'to fear',
    group: 'irregular', auxiliary: 'avoir', participle: 'craint',
    overrides: {
      present:             ['crains','crains','craint','craignons','craignez','craignent'],
      imparfait:           ['craignais','craignais','craignait','craignions','craigniez','craignaient'],
      futurSimple:         ['craindrai','craindras','craindra','craindrons','craindrez','craindront'],
      conditionnelPresent: ['craindrais','craindrais','craindrait','craindrions','craindriez','craindraient'],
      passeSimple:         ['craignis','craignis','craignit','craignîmes','craignîtes','craignirent'],
      subjonctifPresent:   ['craigne','craignes','craigne','craignions','craigniez','craignent'],
      imperatif:           [null,'crains',null,'craignons','craignez',null],
    },
  },
  {
    infinitive: 'peindre', english: 'to paint',
    group: 'irregular', auxiliary: 'avoir', participle: 'peint',
    overrides: {
      present:             ['peins','peins','peint','peignons','peignez','peignent'],
      imparfait:           ['peignais','peignais','peignait','peignions','peigniez','peignaient'],
      futurSimple:         ['peindrai','peindras','peindra','peindrons','peindrez','peindront'],
      conditionnelPresent: ['peindrais','peindrais','peindrait','peindrions','peindriez','peindraient'],
      passeSimple:         ['peignis','peignis','peignit','peignîmes','peignîtes','peignirent'],
      subjonctifPresent:   ['peigne','peignes','peigne','peignions','peigniez','peignent'],
      imperatif:           [null,'peins',null,'peignons','peignez',null],
    },
  },
  {
    infinitive: 'atteindre', english: 'to reach',
    group: 'irregular', auxiliary: 'avoir', participle: 'atteint',
    overrides: {
      present:             ['atteins','atteins','atteint','atteignons','atteignez','atteignent'],
      imparfait:           ['atteignais','atteignais','atteignait','atteignions','atteigniez','atteignaient'],
      futurSimple:         ['atteindrai','atteindras','atteindra','atteindrons','atteindrez','atteindront'],
      conditionnelPresent: ['atteindrais','atteindrais','atteindrait','atteindrions','atteindriez','atteindraient'],
      passeSimple:         ['atteignis','atteignis','atteignit','atteignîmes','atteignîtes','atteignirent'],
      subjonctifPresent:   ['atteigne','atteignes','atteigne','atteignions','atteigniez','atteignent'],
      imperatif:           [null,'atteins',null,'atteignons','atteignez',null],
    },
  },
  {
    infinitive: 'éteindre', english: 'to turn off / extinguish',
    group: 'irregular', auxiliary: 'avoir', participle: 'éteint',
    overrides: {
      present:             ['éteins','éteins','éteint','éteignons','éteignez','éteignent'],
      imparfait:           ['éteignais','éteignais','éteignait','éteignions','éteigniez','éteignaient'],
      futurSimple:         ['éteindrai','éteindras','éteindra','éteindrons','éteindrez','éteindront'],
      conditionnelPresent: ['éteindrais','éteindrais','éteindrait','éteindrions','éteindriez','éteindraient'],
      passeSimple:         ['éteignis','éteignis','éteignit','éteignîmes','éteignîtes','éteignirent'],
      subjonctifPresent:   ['éteigne','éteignes','éteigne','éteignions','éteigniez','éteignent'],
      imperatif:           [null,'éteins',null,'éteignons','éteignez',null],
    },
  },
  {
    infinitive: 'battre', english: 'to beat',
    group: 'irregular', auxiliary: 'avoir', participle: 'battu',
    overrides: {
      present:             ['bats','bats','bat','battons','battez','battent'],
      imparfait:           ['battais','battais','battait','battions','battiez','battaient'],
      futurSimple:         ['battrai','battras','battra','battrons','battrez','battront'],
      conditionnelPresent: ['battrais','battrais','battrait','battrions','battriez','battraient'],
      passeSimple:         ['battis','battis','battit','battîmes','battîtes','battirent'],
      subjonctifPresent:   ['batte','battes','batte','battions','battiez','battent'],
      imperatif:           [null,'bats',null,'battons','battez',null],
    },
  },
  {
    infinitive: 'croire', english: 'to believe',
    group: 'irregular', auxiliary: 'avoir', participle: 'cru',
    overrides: {
      present:             ['crois','crois','croit','croyons','croyez','croient'],
      imparfait:           ['croyais','croyais','croyait','croyions','croyiez','croyaient'],
      futurSimple:         ['croirai','croiras','croira','croirons','croirez','croiront'],
      conditionnelPresent: ['croirais','croirais','croirait','croirions','croiriez','croiraient'],
      passeSimple:         ['crus','crus','crut','crûmes','crûtes','crurent'],
      subjonctifPresent:   ['croie','croies','croie','croyions','croyiez','croient'],
      imperatif:           [null,'crois',null,'croyons','croyez',null],
    },
  },
  {
    infinitive: 'boire', english: 'to drink',
    group: 'irregular', auxiliary: 'avoir', participle: 'bu',
    overrides: {
      present:             ['bois','bois','boit','buvons','buvez','boivent'],
      imparfait:           ['buvais','buvais','buvait','buvions','buviez','buvaient'],
      futurSimple:         ['boirai','boiras','boira','boirons','boirez','boiront'],
      conditionnelPresent: ['boirais','boirais','boirait','boirions','boiriez','boiraient'],
      passeSimple:         ['bus','bus','but','bûmes','bûtes','burent'],
      subjonctifPresent:   ['boive','boives','boive','buvions','buviez','boivent'],
      imperatif:           [null,'bois',null,'buvons','buvez',null],
    },
  },
  {
    infinitive: 'recevoir', english: 'to receive',
    group: 'irregular', auxiliary: 'avoir', participle: 'reçu',
    overrides: {
      present:             ['reçois','reçois','reçoit','recevons','recevez','reçoivent'],
      imparfait:           ['recevais','recevais','recevait','recevions','receviez','recevaient'],
      futurSimple:         ['recevrai','recevras','recevra','recevrons','recevrez','recevront'],
      conditionnelPresent: ['recevrais','recevrais','recevrait','recevrions','recevriez','recevraient'],
      passeSimple:         ['reçus','reçus','reçut','reçûmes','reçûtes','reçurent'],
      subjonctifPresent:   ['reçoive','reçoives','reçoive','recevions','receviez','reçoivent'],
      imperatif:           [null,'reçois',null,'recevons','recevez',null],
    },
  },
  {
    infinitive: 'apercevoir', english: 'to notice / catch sight of',
    group: 'irregular', auxiliary: 'avoir', participle: 'aperçu',
    overrides: {
      present:             ['aperçois','aperçois','aperçoit','apercevons','apercevez','aperçoivent'],
      imparfait:           ['apercevais','apercevais','apercevait','apercevions','aperceviez','apercevaient'],
      futurSimple:         ['apercevrai','apercevras','apercevra','apercevrons','apercevrez','apercevront'],
      conditionnelPresent: ['apercevrais','apercevrais','apercevrait','apercevrions','apercevriez','apercevraient'],
      passeSimple:         ['aperçus','aperçus','aperçut','aperçûmes','aperçûtes','aperçurent'],
      subjonctifPresent:   ['aperçoive','aperçoives','aperçoive','apercevions','aperceviez','aperçoivent'],
      imperatif:           [null,'aperçois',null,'apercevons','apercevez',null],
    },
  },
  {
    infinitive: 'devoir', english: 'to have to / must',
    group: 'irregular', auxiliary: 'avoir', participle: 'dû',
    overrides: {
      present:             ['dois','dois','doit','devons','devez','doivent'],
      imparfait:           ['devais','devais','devait','devions','deviez','devaient'],
      futurSimple:         ['devrai','devras','devra','devrons','devrez','devront'],
      conditionnelPresent: ['devrais','devrais','devrait','devrions','devriez','devraient'],
      passeSimple:         ['dus','dus','dut','dûmes','dûtes','durent'],
      subjonctifPresent:   ['doive','doives','doive','devions','deviez','doivent'],
      imperatif:           [null,null,null,null,null,null],
    },
  },
  {
    infinitive: 'valoir', english: 'to be worth',
    group: 'irregular', auxiliary: 'avoir', participle: 'valu',
    overrides: {
      present:             ['vaux','vaux','vaut','valons','valez','valent'],
      imparfait:           ['valais','valais','valait','valions','valiez','valaient'],
      futurSimple:         ['vaudrai','vaudras','vaudra','vaudrons','vaudrez','vaudront'],
      conditionnelPresent: ['vaudrais','vaudrais','vaudrait','vaudrions','vaudriez','vaudraient'],
      passeSimple:         ['valus','valus','valut','valûmes','valûtes','valurent'],
      subjonctifPresent:   ['vaille','vailles','vaille','valions','valiez','vaillent'],
      imperatif:           [null,null,null,null,null,null],
    },
  },
  {
    infinitive: 'acquérir', english: 'to acquire',
    group: 'irregular', auxiliary: 'avoir', participle: 'acquis',
    overrides: {
      present:             ['acquiers','acquiers','acquiert','acquérons','acquérez','acquièrent'],
      imparfait:           ['acquérais','acquérais','acquérait','acquérions','acquériez','acquéraient'],
      futurSimple:         ['acquerrai','acquerras','acquerra','acquerrons','acquerrez','acquerront'],
      conditionnelPresent: ['acquerrais','acquerrais','acquerrait','acquerrions','acquerriez','acquerraient'],
      passeSimple:         ['acquis','acquis','acquit','acquîmes','acquîtes','acquirent'],
      subjonctifPresent:   ['acquière','acquières','acquière','acquérions','acquériez','acquièrent'],
      imperatif:           [null,'acquiers',null,'acquérons','acquérez',null],
    },
  },
  {
    infinitive: 'cueillir', english: 'to pick / gather',
    group: 'irregular', auxiliary: 'avoir', participle: 'cueilli',
    overrides: {
      present:             ['cueille','cueilles','cueille','cueillons','cueillez','cueillent'],
      imparfait:           ['cueillais','cueillais','cueillait','cueillions','cueilliez','cueillaient'],
      futurSimple:         ['cueillerai','cueilleras','cueillera','cueillerons','cueillerez','cueilleront'],
      conditionnelPresent: ['cueillerais','cueillerais','cueillerait','cueillerions','cueilleriez','cueilleraient'],
      passeSimple:         ['cueillis','cueillis','cueillit','cueillîmes','cueillîtes','cueillirent'],
      subjonctifPresent:   ['cueille','cueilles','cueille','cueillions','cueilliez','cueillent'],
      imperatif:           [null,'cueille',null,'cueillons','cueillez',null],
    },
  },
  {
    infinitive: 'falloir', english: 'to be necessary (il faut)',
    group: 'irregular', auxiliary: 'avoir', participle: 'fallu',
    impersonal: true,
    overrides: {
      present:             [null,null,'faut',null,null,null],
      imparfait:           [null,null,'fallait',null,null,null],
      futurSimple:         [null,null,'faudra',null,null,null],
      conditionnelPresent: [null,null,'faudrait',null,null,null],
      passeSimple:         [null,null,'fallut',null,null,null],
      subjonctifPresent:   [null,null,'faille',null,null,null],
      imperatif:           [null,null,null,null,null,null],
    },
  },
  {
    infinitive: 'pleuvoir', english: 'to rain (il pleut)',
    group: 'irregular', auxiliary: 'avoir', participle: 'plu',
    impersonal: true,
    overrides: {
      present:             [null,null,'pleut',null,null,null],
      imparfait:           [null,null,'pleuvait',null,null,null],
      futurSimple:         [null,null,'pleuvra',null,null,null],
      conditionnelPresent: [null,null,'pleuvrait',null,null,null],
      passeSimple:         [null,null,'plut',null,null,null],
      subjonctifPresent:   [null,null,'pleuve',null,null,null],
      imperatif:           [null,null,null,null,null,null],
    },
  },
  {
    infinitive: 'rire', english: 'to laugh',
    group: 'irregular', auxiliary: 'avoir', participle: 'ri',
    overrides: {
      present:             ['ris','ris','rit','rions','riez','rient'],
      imparfait:           ['riais','riais','riait','riions','riiez','riaient'],
      futurSimple:         ['rirai','riras','rira','rirons','rirez','riront'],
      conditionnelPresent: ['rirais','rirais','rirait','ririons','ririez','riraient'],
      passeSimple:         ['ris','ris','rit','rîmes','rîtes','rirent'],
      subjonctifPresent:   ['rie','ries','rie','riions','riiez','rient'],
      imperatif:           [null,'ris',null,'rions','riez',null],
    },
  },
  {
    infinitive: 'plaire', english: 'to please',
    group: 'irregular', auxiliary: 'avoir', participle: 'plu',
    overrides: {
      present:             ['plais','plais','plaît','plaisons','plaisez','plaisent'],
      imparfait:           ['plaisais','plaisais','plaisait','plaisions','plaisiez','plaisaient'],
      futurSimple:         ['plairai','plairas','plaira','plairons','plairez','plairont'],
      conditionnelPresent: ['plairais','plairais','plairait','plairions','plairiez','plairaient'],
      passeSimple:         ['plus','plus','plut','plûmes','plûtes','plurent'],
      subjonctifPresent:   ['plaise','plaises','plaise','plaisions','plaisiez','plaisent'],
      imperatif:           [null,'plais',null,'plaisons','plaisez',null],
    },
  },
  {
    infinitive: 'taire', english: 'to keep quiet / silence',
    group: 'irregular', auxiliary: 'avoir', participle: 'tu',
    overrides: {
      present:             ['tais','tais','tait','taisons','taisez','taisent'],
      imparfait:           ['taisais','taisais','taisait','taisions','taisiez','taisaient'],
      futurSimple:         ['tairai','tairas','taira','tairons','tairez','tairont'],
      conditionnelPresent: ['tairais','tairais','tairait','tairions','tairiez','tairaient'],
      passeSimple:         ['tus','tus','tut','tûmes','tûtes','turent'],
      subjonctifPresent:   ['taise','taises','taise','taisions','taisiez','taisent'],
      imperatif:           [null,'tais',null,'taisons','taisez',null],
    },
  },
  {
    infinitive: 'sortir', english: 'to go out',
    group: 'irregular', auxiliary: 'être', participle: 'sorti',
    overrides: {
      present:             ['sors','sors','sort','sortons','sortez','sortent'],
      imparfait:           ['sortais','sortais','sortait','sortions','sortiez','sortaient'],
      futurSimple:         ['sortirai','sortiras','sortira','sortirons','sortirez','sortiront'],
      conditionnelPresent: ['sortirais','sortirais','sortirait','sortirions','sortiriez','sortiraient'],
      passeSimple:         ['sortis','sortis','sortit','sortîmes','sortîtes','sortirent'],
      subjonctifPresent:   ['sorte','sortes','sorte','sortions','sortiez','sortent'],
      imperatif:           [null,'sors',null,'sortons','sortez',null],
    },
  },
  {
    infinitive: 'dormir', english: 'to sleep',
    group: 'irregular', auxiliary: 'avoir', participle: 'dormi',
    overrides: {
      present:             ['dors','dors','dort','dormons','dormez','dorment'],
      imparfait:           ['dormais','dormais','dormait','dormions','dormiez','dormaient'],
      futurSimple:         ['dormirai','dormiras','dormira','dormirons','dormirez','dormiront'],
      conditionnelPresent: ['dormirais','dormirais','dormirait','dormirions','dormiriez','dormiraient'],
      passeSimple:         ['dormis','dormis','dormit','dormîmes','dormîtes','dormirent'],
      subjonctifPresent:   ['dorme','dormes','dorme','dormions','dormiez','dorment'],
      imperatif:           [null,'dors',null,'dormons','dormez',null],
    },
  },
  {
    infinitive: 'envoyer', english: 'to send',
    group: 'irregular', auxiliary: 'avoir', participle: 'envoyé',
    overrides: {
      present:             ['envoie','envoies','envoie','envoyons','envoyez','envoient'],
      imparfait:           ['envoyais','envoyais','envoyait','envoyions','envoyiez','envoyaient'],
      futurSimple:         ['enverrai','enverras','enverra','enverrons','enverrez','enverront'],
      conditionnelPresent: ['enverrais','enverrais','enverrait','enverrions','enverriez','enverraient'],
      passeSimple:         ['envoyai','envoyas','envoya','envoyâmes','envoyâtes','envoyèrent'],
      subjonctifPresent:   ['envoie','envoies','envoie','envoyions','envoyiez','envoient'],
      imperatif:           [null,'envoie',null,'envoyons','envoyez',null],
    },
  },
  {
    infinitive: 'apprendre', english: 'to learn',
    group: 'irregular', auxiliary: 'avoir', participle: 'appris',
    overrides: {
      present:             ['apprends','apprends','apprend','apprenons','apprenez','apprennent'],
      imparfait:           ['apprenais','apprenais','apprenait','apprenions','appreniez','apprenaient'],
      futurSimple:         ['apprendrai','apprendras','apprendra','apprendrons','apprendrez','apprendront'],
      conditionnelPresent: ['apprendrais','apprendrais','apprendrait','apprendrions','apprendriez','apprendraient'],
      passeSimple:         ['appris','appris','apprit','apprîmes','apprîtes','apprirent'],
      subjonctifPresent:   ['apprenne','apprennes','apprenne','apprenions','appreniez','apprennent'],
      imperatif:           [null,'apprends',null,'apprenons','apprenez',null],
    },
  },
  {
    infinitive: 'comprendre', english: 'to understand',
    group: 'irregular', auxiliary: 'avoir', participle: 'compris',
    overrides: {
      present:             ['comprends','comprends','comprend','comprenons','comprenez','comprennent'],
      imparfait:           ['comprenais','comprenais','comprenait','comprenions','compreniez','comprenaient'],
      futurSimple:         ['comprendrai','comprendras','comprendra','comprendrons','comprendrez','comprendront'],
      conditionnelPresent: ['comprendrais','comprendrais','comprendrait','comprendrions','comprendriez','comprendraient'],
      passeSimple:         ['compris','compris','comprit','comprîmes','comprîtes','comprirent'],
      subjonctifPresent:   ['comprenne','comprennes','comprenne','comprenions','compreniez','comprennent'],
      imperatif:           [null,'comprends',null,'comprenons','comprenez',null],
    },
  },
  {
    infinitive: 'permettre', english: 'to allow / permit',
    group: 'irregular', auxiliary: 'avoir', participle: 'permis',
    overrides: {
      present:             ['permets','permets','permet','permettons','permettez','permettent'],
      imparfait:           ['permettais','permettais','permettait','permettions','permettiez','permettaient'],
      futurSimple:         ['permettrai','permettras','permettra','permettrons','permettrez','permettront'],
      conditionnelPresent: ['permettrais','permettrais','permettrait','permettrions','permettriez','permettraient'],
      passeSimple:         ['permis','permis','permit','permîmes','permîtes','permirent'],
      subjonctifPresent:   ['permette','permettes','permette','permettions','permettiez','permettent'],
      imperatif:           [null,'permets',null,'permettons','permettez',null],
    },
  },
  {
    infinitive: 'revenir', english: 'to come back',
    group: 'irregular', auxiliary: 'être', participle: 'revenu',
    overrides: {
      present:             ['reviens','reviens','revient','revenons','revenez','reviennent'],
      imparfait:           ['revenais','revenais','revenait','revenions','reveniez','revenaient'],
      futurSimple:         ['reviendrai','reviendras','reviendra','reviendrons','reviendrez','reviendront'],
      conditionnelPresent: ['reviendrais','reviendrais','reviendrait','reviendrions','reviendriez','reviendraient'],
      passeSimple:         ['revins','revins','revint','revînmes','revîntes','revinrent'],
      subjonctifPresent:   ['revienne','reviennes','revienne','revenions','reveniez','reviennent'],
      imperatif:           [null,'reviens',null,'revenons','revenez',null],
    },
  },
  {
    infinitive: 'devenir', english: 'to become',
    group: 'irregular', auxiliary: 'être', participle: 'devenu',
    overrides: {
      present:             ['deviens','deviens','devient','devenons','devenez','deviennent'],
      imparfait:           ['devenais','devenais','devenait','devenions','deveniez','devenaient'],
      futurSimple:         ['deviendrai','deviendras','deviendra','deviendrons','deviendrez','deviendront'],
      conditionnelPresent: ['deviendrais','deviendrais','deviendrait','deviendrions','deviendriez','deviendraient'],
      passeSimple:         ['devins','devins','devint','devînmes','devîntes','devinrent'],
      subjonctifPresent:   ['devienne','deviennes','devienne','devenions','deveniez','deviennent'],
      imperatif:           [null,'deviens',null,'devenons','devenez',null],
    },
  },
];

// ─── Assemble all 200 verbs ───────────────────────────────────────────────────
const RAW_VERBS = [
  ...ER_REGULAR,
  ...ER_SPELLING,
  ...IR_REGULAR,
  ...RE_REGULAR,
  ...IRREGULAR,
];

const VERBS = RAW_VERBS.map(buildVerb);

// ─── Group labels for the UI ──────────────────────────────────────────────────
const VERB_GROUPS = {
  er:        'Réguliers -ER',
  ir:        'Réguliers -IR',
  re:        'Réguliers -RE',
  irregular: 'Irréguliers',
};
