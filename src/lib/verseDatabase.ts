// Local verse database — Bhagavad-gītā As It Is (Prabhupāda translations)
// Lookup function for auto-populating verse text when adding to memorization

export interface VerseEntry {
  ref: string; // e.g. "BG 2.13"
  text: string; // English translation
}

const bgVerses: Record<string, string> = {
  // Chapter 1
  "1.1": "Dhṛtarāṣṭra said: O Sañjaya, after my sons and the sons of Pāṇḍu assembled in the place of pilgrimage at Kurukṣetra, what did they do, being desirous to fight?",
  "1.2": "Sañjaya said: O King, after looking over the army arranged in military formation by the sons of Pāṇḍu, King Duryodhana went to his teacher and spoke the following words.",
  // Chapter 2
  "2.7": "Now I am confused about my duty and have lost all composure because of miserly weakness. In this condition I am asking You to tell me for certain what is best for me. Now I am Your disciple, and a soul surrendered unto You. Please instruct me.",
  "2.11": "The Supreme Personality of Godhead said: While speaking learned words, you are mourning for what is not worthy of grief. Those who are wise lament neither for the living nor for the dead.",
  "2.12": "Never was there a time when I did not exist, nor you, nor all these kings; nor in the future shall any of us cease to be.",
  "2.13": "As the embodied soul continuously passes, in this body, from boyhood to youth to old age, the soul similarly passes into another body at death. A sober person is not bewildered by such a change.",
  "2.14": "O son of Kuntī, the nonpermanent appearance of happiness and distress, and their disappearance in due course, are like the appearance and disappearance of winter and summer seasons. They arise from sense perception, O scion of Bharata, and one must learn to tolerate them without being disturbed.",
  "2.17": "That which pervades the entire body you should know to be indestructible. No one is able to destroy that imperishable soul.",
  "2.18": "The material body of the indestructible, immeasurable and eternal living entity is sure to come to an end; therefore, fight, O descendant of Bharata.",
  "2.19": "Neither he who thinks the living entity the slayer nor he who thinks it slain is in knowledge, for the self slays not nor is slain.",
  "2.20": "For the soul there is neither birth nor death at any time. He has not come into being, does not come into being, and will not come into being. He is unborn, eternal, ever-existing and primeval. He is not slain when the body is slain.",
  "2.22": "As a person puts on new garments, giving up old ones, the soul similarly accepts new material bodies, giving up the old and useless ones.",
  "2.23": "The soul can never be cut to pieces by any weapon, nor burned by fire, nor moistened by water, nor withered by the wind.",
  "2.40": "In this endeavor there is no loss or diminution, and a little advancement on this path can protect one from the most dangerous type of fear.",
  "2.41": "Those who are on this path are resolute in purpose, and their aim is one. O beloved child of the Kurus, the intelligence of those who are irresolute is many-branched.",
  "2.44": "In the minds of those who are too attached to sense enjoyment and material opulence, and who are bewildered by such things, the resolute determination for devotional service to the Supreme Lord does not take place.",
  "2.47": "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.",
  "2.48": "Perform your duty equipoised, O Arjuna, abandoning all attachment to success or failure. Such equanimity is called yoga.",
  "2.56": "One who is not disturbed in mind even amidst the threefold miseries or elated when there is happiness, and who is free from attachment, fear and anger, is called a sage of steady mind.",
  "2.59": "The embodied soul may be restricted from sense enjoyment, though the taste for sense objects remains. But, ceasing such engagements by experiencing a higher taste, he is fixed in consciousness.",
  "2.62": "While contemplating the objects of the senses, a person develops attachment for them, and from such attachment lust develops, and from lust anger arises.",
  "2.63": "From anger, complete delusion arises, and from delusion bewilderment of memory. When memory is bewildered, intelligence is lost, and when intelligence is lost one falls down again into the material pool.",
  "2.64": "But a person free from all attachment and aversion and able to control his senses through regulative principles of freedom can obtain the complete mercy of the Lord.",
  "2.70": "A person who is not disturbed by the incessant flow of desires — that enter like rivers into the ocean, which is ever being filled but is always still — can alone achieve peace, and not the man who strives to satisfy such desires.",
  // Chapter 3
  "3.1": "Arjuna said: O Janārdana, O Keśava, why do You want to engage me in this ghastly warfare, if You think that intelligence is better than fruitive work?",
  "3.2": "My intelligence is bewildered by Your equivocal instructions. Therefore, please tell me decisively which will be most beneficial for me.",
  "3.3": "The Supreme Personality of Godhead said: O sinless Arjuna, I have already explained that there are two classes of men who try to realize the self. Some are inclined to understand it by empirical, philosophical speculation, and others by devotional service.",
  "3.4": "Not by merely abstaining from work can one achieve freedom from reaction, nor by renunciation alone can one attain perfection.",
  "3.5": "Everyone is forced to act helplessly according to the qualities he has acquired from the modes of material nature; therefore no one can refrain from doing something, not even for a moment.",
  "3.6": "One who restrains the senses of action but whose mind dwells on sense objects certainly deludes himself and is called a pretender.",
  "3.7": "On the other hand, if a sincere person tries to control the active senses by the mind and begins karma-yoga without attachment, he is by far superior.",
  "3.8": "Perform your prescribed duty, for doing so is better than not working. One cannot even maintain one's physical body without work.",
  "3.9": "Work done as a sacrifice for Viṣṇu has to be performed, otherwise work causes bondage in this material world. Therefore, O son of Kuntī, perform your prescribed duties for His satisfaction, and in that way you will always remain free from bondage.",
  "3.10": "In the beginning of creation, the Lord of all creatures sent forth generations of men and demigods, along with sacrifices for Viṣṇu, and blessed them by saying, 'Be thou happy by this yajña because its performance will bestow upon you everything desirable for living happily and achieving liberation.'",
  "3.11": "The demigods, being pleased by sacrifices, will also please you, and thus, by cooperation between men and demigods, prosperity will reign for all.",
  "3.12": "In charge of the various necessities of life, the demigods, being satisfied by the performance of yajña, will supply all necessities to you. But he who enjoys such gifts without offering them to the demigods in return is certainly a thief.",
  "3.13": "The devotees of the Lord are released from all kinds of sins because they eat food which is offered first for sacrifice. Others, who prepare food for personal sense enjoyment, verily eat only sin.",
  "3.14": "All living bodies subsist on food grains, which are produced from rains. Rains are produced by performance of yajña, and yajña is born of prescribed duties.",
  "3.15": "Regulated activities are prescribed in the Vedas, and the Vedas are directly manifested from the Supreme Personality of Godhead. Consequently the all-pervading Transcendence is eternally situated in acts of sacrifice.",
  "3.16": "My dear Arjuna, one who does not follow in human life the cycle of sacrifice thus established by the Vedas certainly leads a life full of sin. Living only for the satisfaction of the senses, such a person lives in vain.",
  "3.17": "But for one who takes pleasure in the Self, whose human life is one of self-realization, and who is satisfied in the Self only, fully satiated — for him there is no duty.",
  "3.18": "A self-realized man has no purpose to fulfill in the discharge of his prescribed duties, nor has he any reason not to perform such work. Nor has he any need to depend on any other living being.",
  "3.19": "Therefore, without being attached to the fruits of activities, one should act as a matter of duty, for by working without attachment one attains the Supreme.",
  "3.20": "Kings such as Janaka attained perfection solely by performance of prescribed duties. Therefore, just for the sake of educating the people in general, you should perform your work.",
  "3.21": "Whatever action a great man performs, common men follow. And whatever standards he sets by exemplary acts, all the world pursues.",
  "3.22": "O son of Pṛthā, there is no work prescribed for Me within all the three planetary systems. Nor am I in want of anything, nor have I a need to obtain anything — and yet I am engaged in prescribed duties.",
  "3.23": "For if I ever failed to engage in carefully performing prescribed duties, O Pārtha, certainly all men would follow My path.",
  "3.24": "If I did not perform prescribed duties, all these worlds would be put to ruination. I would be the cause of creating unwanted population, and I would thereby destroy the peace of all living beings.",
  "3.25": "As the ignorant perform their duties with attachment to results, the learned may similarly act, but without attachment, for the sake of leading people on the right path.",
  "3.26": "So as not to disrupt the minds of ignorant men attached to the fruitive results of prescribed duties, a learned person should not induce them to stop work. Rather, by working in the spirit of devotion, he should engage them in all sorts of activities.",
  "3.27": "The spirit soul bewildered by the influence of false ego thinks himself the doer of activities that are in actuality carried out by the three modes of material nature.",
  "3.28": "One who is in knowledge of the Absolute Truth, O mighty-armed, does not engage himself in the senses and sense gratification, knowing well the differences between work in devotion and work for fruitive results.",
  "3.29": "Bewildered by the modes of material nature, the ignorant fully engage themselves in material activities and become attached. But the wise should not unsettle them, although these duties are inferior due to the performers' lack of knowledge.",
  "3.30": "Therefore, O Arjuna, surrendering all your works unto Me, with full knowledge of Me, without desires for profit, with no claims to proprietorship, and free from lethargy, fight.",
  "3.31": "Those persons who execute their duties according to My injunctions and who follow this teaching faithfully, without envy, become free from the bondage of fruitive actions.",
  "3.32": "But those who, out of envy, disregard these teachings and do not follow them are to be considered bereft of all knowledge, befooled, and ruined in their endeavors for perfection.",
  "3.33": "Even a man of knowledge acts according to his own nature, for everyone follows the nature he has acquired from the three modes. What can repression accomplish?",
  "3.34": "There are principles to regulate attachment and aversion pertaining to the senses and their objects. One should not come under the control of such attachment and aversion, because they are stumbling blocks on the path of self-realization.",
  "3.35": "It is far better to discharge one's prescribed duties, even though faultily, than another's duties perfectly. Destruction in the course of performing one's own duty is better than engaging in another's duties, for to follow another's path is dangerous.",
  "3.36": "Arjuna said: O descendant of Vṛṣṇi, by what is one impelled to sinful acts, even unwillingly, as if engaged by force?",
  "3.37": "The Supreme Personality of Godhead said: It is lust only, Arjuna, which is born of contact with the material mode of passion and later transformed into wrath, and which is the all-devouring sinful enemy of this world.",
  "3.38": "As fire is covered by smoke, as a mirror is covered by dust, or as the embryo is covered by the womb, the living entity is similarly covered by different degrees of this lust.",
  "3.39": "Thus the wise living entity's pure consciousness becomes covered by his eternal enemy in the form of lust, which is never satisfied and which burns like fire.",
  "3.40": "The senses, the mind and the intelligence are the sitting places of this lust. Through them lust covers the real knowledge of the living entity and bewilders him.",
  "3.41": "Therefore, O Arjuna, best of the Bhāratas, in the very beginning curb this great symbol of sin — lust — by regulating the senses, and slay this destroyer of knowledge and self-realization.",
  "3.42": "The working senses are superior to dull matter; mind is higher than the senses; intelligence is still higher than the mind; and he [the soul] is even higher than the intelligence.",
  "3.43": "Thus knowing oneself to be transcendental to the material senses, mind and intelligence, O mighty-armed Arjuna, one should steady the mind by deliberate spiritual intelligence and thus — by spiritual strength — conquer this insatiable enemy known as lust.",
  // Chapter 4
  "4.1": "The Personality of Godhead, Lord Śrī Kṛṣṇa, said: I instructed this imperishable science of yoga to the sun-god, Vivasvān, and Vivasvān instructed it to Manu, the father of mankind, and Manu in turn instructed it to Ikṣvāku.",
  "4.2": "This supreme science was thus received through the chain of disciplic succession, and the saintly kings understood it in that way. But in course of time the succession was broken, and therefore the science as it is appears to be lost.",
  "4.3": "That very ancient science of the relationship with the Supreme is today told by Me to you because you are My devotee as well as My friend and can therefore understand the transcendental mystery of this science.",
  "4.5": "The Personality of Godhead said: Many, many births both you and I have passed. I can remember all of them, but you cannot, O subduer of the enemy!",
  "4.6": "Although I am unborn and My transcendental body never deteriorates, and although I am the Lord of all living entities, I still appear in every millennium in My original transcendental form.",
  "4.7": "Whenever and wherever there is a decline in religious practice, O descendant of Bharata, and a predominant rise of irreligion — at that time I descend Myself.",
  "4.8": "To deliver the pious and to annihilate the miscreants, as well as to reestablish the principles of religion, I Myself appear, millennium after millennium.",
  "4.9": "One who knows the transcendental nature of My appearance and activities does not, upon leaving the body, take his birth again in this material world, but attains My eternal abode, O Arjuna.",
  "4.10": "Being freed from attachment, fear and anger, being fully absorbed in Me and taking refuge in Me, many, many persons in the past became purified by knowledge of Me — and thus they all attained transcendental love for Me.",
  "4.11": "As all surrender unto Me, I reward them accordingly. Everyone follows My path in all respects, O son of Pṛthā.",
  "4.13": "According to the three modes of material nature and the work associated with them, the four divisions of human society are created by Me. And although I am the creator of this system, you should know that I am yet the nondoer, being unchangeable.",
  "4.34": "Just try to learn the truth by approaching a spiritual master. Inquire from him submissively and render service unto him. The self-realized souls can impart knowledge unto you because they have seen the truth.",
  "4.35": "Having obtained real knowledge from a self-realized soul, you will never fall again into such illusion, for by this knowledge you will see that all living beings are but part of the Supreme, or, in other words, that they are Mine.",
  "4.36": "Even if you are considered to be the most sinful of all sinners, when you are situated in the boat of transcendental knowledge you will be able to cross over the ocean of miseries.",
  "4.37": "As a blazing fire turns firewood to ashes, O Arjuna, so does the fire of knowledge burn to ashes all reactions to material activities.",
  "4.38": "In this world, there is nothing so sublime and pure as transcendental knowledge. Such knowledge is the mature fruit of all mysticism. And one who has become accomplished in the practice of devotional service enjoys this knowledge within himself in due course of time.",
  "4.39": "A faithful man who is dedicated to transcendental knowledge and who subdues his senses is eligible to achieve such knowledge, and having achieved it he quickly attains the supreme spiritual peace.",
  // Chapter 5
  "5.10": "One who performs his duty without attachment, surrendering the results unto the Supreme Lord, is unaffected by sinful action, as the lotus leaf is untouched by water.",
  "5.18": "The humble sages, by virtue of true knowledge, see with equal vision a learned and gentle brāhmaṇa, a cow, an elephant, a dog and a dog-eater.",
  "5.22": "An intelligent person does not take part in the sources of misery, which are due to contact with the material senses. O son of Kuntī, such pleasures have a beginning and an end, and so the wise man does not delight in them.",
  "5.29": "A person in full consciousness of Me, knowing Me to be the ultimate beneficiary of all sacrifices and austerities, the Supreme Lord of all planets and demigods, and the benefactor and well-wisher of all living entities, attains peace from the pangs of material miseries.",
  // Chapter 6
  "6.5": "One must deliver himself with the help of his mind, and not degrade himself. The mind is the friend of the conditioned soul, and his enemy as well.",
  "6.6": "For him who has conquered the mind, the mind is the best of friends; but for one who has failed to do so, his mind will remain the greatest enemy.",
  "6.7": "For one who has conquered the mind, the Supersoul is already reached, for he has attained tranquility. To such a man happiness and distress, heat and cold, honor and dishonor are all the same.",
  "6.17": "He who is regulated in his habits of eating, sleeping, recreation and work can mitigate all material pains by practicing the yoga system.",
  "6.20": "In the stage of perfection called trance, or samādhi, one's mind is completely restrained from material mental activities by practice of yoga. This perfection is characterized by one's ability to see the self by the pure mind and to relish and rejoice in the self.",
  "6.26": "From wherever the mind wanders due to its flickering and unsteady nature, one must certainly withdraw it and bring it back under the control of the Self.",
  "6.30": "For one who sees Me everywhere and sees everything in Me, I am never lost, nor is he ever lost to Me.",
  "6.34": "Arjuna said: O Kṛṣṇa, the mind is restless, turbulent, obstinate and very strong, and to subdue it, I think, is more difficult than controlling the wind.",
  "6.35": "Lord Śrī Kṛṣṇa said: O mighty-armed son of Kuntī, it is undoubtedly very difficult to curb the restless mind, but it is possible by suitable practice and by detachment.",
  "6.47": "And of all yogīs, the one with great faith who always abides in Me, thinks of Me within himself, and renders transcendental loving service to Me — he is the most intimately united with Me in yoga and is the highest of all. That is My opinion.",
  // Chapter 7
  "7.1": "The Supreme Personality of Godhead said: Now hear, O son of Pṛthā, how by practicing yoga in full consciousness of Me, with mind attached to Me, you can know Me in full, free from doubt.",
  "7.3": "Out of many thousands among men, one may endeavor for perfection, and of those who have achieved perfection, hardly one knows Me in truth.",
  "7.7": "O conqueror of wealth, there is no truth superior to Me. Everything rests upon Me, as pearls are strung on a thread.",
  "7.14": "This divine energy of Mine, consisting of the three modes of material nature, is difficult to overcome. But those who have surrendered unto Me can easily cross beyond it.",
  "7.15": "Those miscreants who are grossly foolish, who are lowest among mankind, whose knowledge is stolen by illusion, and who partake of the atheistic nature of demons do not surrender unto Me.",
  "7.16": "O best among the Bhāratas, four kinds of pious men begin to render devotional service unto Me — the distressed, the desirer of wealth, the inquisitive, and he who is searching for knowledge of the Absolute.",
  "7.19": "After many births and deaths, he who is actually in knowledge surrenders unto Me, knowing Me to be the cause of all causes and all that is. Such a great soul is very rare.",
  // Chapter 8
  "8.5": "And whoever, at the end of his life, quits his body remembering Me alone at once attains My nature. Of this there is no doubt.",
  "8.6": "Whatever state of being one remembers when he quits his body, O son of Kuntī, that state he will attain without fail.",
  "8.7": "Therefore, Arjuna, you should always think of Me in the form of Kṛṣṇa and at the same time carry out your prescribed duty of fighting. With your activities dedicated to Me and your mind and intelligence fixed on Me, you will attain Me without doubt.",
  "8.14": "For one who always remembers Me without deviation, I am easy to obtain, O son of Pṛthā, because of his constant engagement in devotional service.",
  "8.15": "After attaining Me, the great souls, who are yogīs in devotion, never return to this temporary world, which is full of miseries, because they have attained the highest perfection.",
  "8.16": "From the highest planet in the material world down to the lowest, all are places of misery wherein repeated birth and death take place. But one who attains to My abode, O son of Kuntī, never takes birth again.",
  // Chapter 9
  "9.2": "This knowledge is the king of education, the most secret of all secrets. It is the purest knowledge, and because it gives direct perception of the self by realization, it is the perfection of religion. It is everlasting, and it is joyfully performed.",
  "9.10": "This material nature, which is one of My energies, is working under My direction, O son of Kuntī, producing all moving and nonmoving beings. Under its rule this manifestation is created and annihilated again and again.",
  "9.13": "O son of Pṛthā, those who are not deluded, the great souls, are under the protection of the divine nature. They are fully engaged in devotional service because they know Me as the Supreme Personality of Godhead, original and inexhaustible.",
  "9.14": "Always chanting My glories, endeavoring with great determination, bowing down before Me, these great souls perpetually worship Me with devotion.",
  "9.22": "But those who always worship Me with exclusive devotion, meditating on My transcendental form — to them I carry what they lack, and I preserve what they have.",
  "9.26": "If one offers Me with love and devotion a leaf, a flower, a fruit or water, I will accept it.",
  "9.27": "Whatever you do, whatever you eat, whatever you offer or give away, and whatever austerities you perform — do that, O son of Kuntī, as an offering to Me.",
  "9.29": "I envy no one, nor am I partial to anyone. I am equal to all. But whoever renders service unto Me in devotion is a friend, is in Me, and I am also a friend to him.",
  "9.30": "Even if one commits the most abominable action, if he is engaged in devotional service he is to be considered saintly because he is properly situated in his determination.",
  "9.34": "Engage your mind always in thinking of Me, become My devotee, offer obeisances to Me and worship Me. Being completely absorbed in Me, surely you will come to Me.",
  // Chapter 10
  "10.8": "I am the source of all spiritual and material worlds. Everything emanates from Me. The wise who perfectly know this engage in My devotional service and worship Me with all their hearts.",
  "10.9": "The thoughts of My pure devotees dwell in Me, their lives are fully devoted to My service, and they derive great satisfaction and bliss from always enlightening one another and conversing about Me.",
  "10.10": "To those who are constantly devoted to serving Me with love, I give the understanding by which they can come to Me.",
  "10.11": "To show them special mercy, I, dwelling in their hearts, destroy with the shining lamp of knowledge the darkness born of ignorance.",
  "10.12": "Arjuna said: You are the Supreme Personality of Godhead, the ultimate abode, the purest, the Absolute Truth. You are the eternal, transcendental, original person, the unborn, the greatest.",
  // Chapter 11
  "11.32": "The Supreme Personality of Godhead said: Time I am, the great destroyer of the worlds, and I have come here to destroy all people.",
  "11.55": "My dear Arjuna, he who engages in My pure devotional service, free from the contaminations of fruitive activities and mental speculation, he who works for Me, who makes Me the supreme goal of his life, and who is friendly to every living being — he certainly comes to Me.",
  // Chapter 12
  "12.8": "Just fix your mind upon Me, the Supreme Personality of Godhead, and engage all your intelligence in Me. Thus you will live in Me always, without a doubt.",
  "12.13": "One who is not envious but is a kind friend to all living entities, who does not think himself a proprietor and is free from false ego, who is equal in both happiness and distress, who is tolerant, always satisfied, self-controlled, and engaged in devotional service with determination, his mind and intelligence fixed on Me — such a devotee of Mine is very dear to Me.",
  "12.15": "He for whom no one is put into difficulty and who is not disturbed by anyone, who is equipoised in happiness and distress, fear and anxiety, is very dear to Me.",
  // Chapter 13
  "13.8": "Humility; pridelessness; nonviolence; tolerance; simplicity; approaching a bona fide spiritual master; cleanliness; steadiness; self-control; renunciation of the objects of sense gratification; absence of false ego — all these I declare to be knowledge.",
  "13.22": "Yet in this body there is another, a transcendental enjoyer, who is the Lord, the supreme proprietor, who exists as the overseer and permitter, and who is known as the Supersoul.",
  // Chapter 14
  "14.26": "One who engages in full devotional service, unfailing in all circumstances, at once transcends the modes of material nature and thus comes to the level of Brahman.",
  // Chapter 15
  "15.5": "Those who are free from false prestige, illusion and false association, who understand the eternal, who are done with material lust, who are freed from the dualities of happiness and distress, and who, unbewildered, know how to surrender unto the Supreme Person attain to that eternal kingdom.",
  "15.6": "That supreme abode of Mine is not illumined by the sun or moon, nor by fire or electricity. Those who reach it never return to this material world.",
  "15.7": "The living entities in this conditioned world are My eternal fragmental parts. Due to conditioned life, they are struggling very hard with the six senses, which include the mind.",
  "15.15": "I am seated in everyone's heart, and from Me come remembrance, knowledge and forgetfulness. By all the Vedas, I am to be known. Indeed, I am the compiler of Vedānta, and I am the knower of the Vedas.",
  // Chapter 16
  "16.1": "The Supreme Personality of Godhead said: Fearlessness; purification of one's existence; cultivation of spiritual knowledge; charity; self-control; performance of sacrifice; study of the Vedas; austerity; simplicity — all these are transcendental qualities.",
  "16.3": "Nonviolence; truthfulness; freedom from anger; renunciation; tranquility; aversion to faultfinding; compassion for all living entities; freedom from covetousness; gentleness; modesty; steady determination — these are some of the transcendental qualities.",
  // Chapter 17
  "17.15": "Austerity of speech consists in speaking words that are truthful, pleasing, beneficial, and not agitating to others, and also in regularly reciting Vedic literature.",
  // Chapter 18
  "18.54": "One who is thus transcendentally situated at once realizes the Supreme Brahman and becomes fully joyful. He never laments or desires to have anything. He is equally disposed toward every living entity. In that state he attains pure devotional service unto Me.",
  "18.55": "One can understand Me as I am, as the Supreme Personality of Godhead, only by devotional service. And when one is in full consciousness of Me by such devotion, he can enter into the kingdom of God.",
  "18.61": "The Supreme Lord is situated in everyone's heart, O Arjuna, and is directing the wanderings of all living entities, who are seated as on a machine, made of the material energy.",
  "18.65": "Always think of Me, become My devotee, worship Me and offer your homage unto Me. Thus you will come to Me without fail. I promise you this because you are My very dear friend.",
  "18.66": "Abandon all varieties of religion and just surrender unto Me. I shall deliver you from all sinful reactions. Do not fear.",
  "18.68": "For one who explains this supreme secret to the devotees, pure devotional service is guaranteed, and at the end he will come back to Me.",
  "18.69": "There is no servant in this world more dear to Me than he, nor will there ever be one more dear.",
  "18.78": "Wherever there is Kṛṣṇa, the master of all mystics, and wherever there is Arjuna, the supreme archer, there will also certainly be opulence, victory, extraordinary power, and morality. That is my opinion.",
};

// Brahma-saṁhitā key verses
const bsVerses: Record<string, string> = {
  "5.33": "I worship Govinda, the primeval Lord, who by the agency of His own spiritual potency is the primeval Lord, with an abundance of diverse energies. He is the origin of all, the enjoyer of all, and the friend of all. He is the source of all incarnations, and the cause of all causes. He is the Supreme Personality of Godhead, full in six opulences, and His transcendental form is eternal, blissful and full of knowledge.",
};

// CC Madhya-līlā key verses
const ccMadhyaVerses: Record<string, string> = {
  "7.128": "Instruct everyone to follow the orders of Lord Śrī Kṛṣṇa as they are given in the Bhagavad-gītā and Śrīmad-Bhāgavatam. In this way become a spiritual master and try to liberate everyone in this land.",
};

// SB key verses
const sbVerses: Record<string, string> = {
  "1.1.1": "O my Lord, Śrī Kṛṣṇa, son of Vasudeva, O all-pervading Personality of Godhead, I offer my respectful obeisances unto You. I meditate upon Lord Śrī Kṛṣṇa because He is the Absolute Truth and the primeval cause of all causes of the creation, sustenance and destruction of the manifested universes.",
  "1.1.2": "Completely rejecting all religious activities which are materially motivated, this Bhāgavata Purāṇa propounds the highest truth, which is understandable by those devotees who are fully pure in heart.",
  "1.2.6": "The supreme occupation for all humanity is that by which men can attain to loving devotional service unto the transcendent Lord. Such devotional service must be unmotivated and uninterrupted to completely satisfy the self.",
  "1.2.7": "By rendering devotional service unto the Personality of Godhead, Śrī Kṛṣṇa, one immediately acquires causeless knowledge and detachment from the world.",
  "1.2.17": "Śrī Kṛṣṇa, the Personality of Godhead, who is the Paramātmā in everyone's heart and the benefactor of the truthful devotee, cleanses desire for material enjoyment from the heart of the devotee who has developed the urge to hear His messages.",
  "1.2.18": "By regular attendance in classes on the Bhāgavatam and by rendering of service to the pure devotee, all that is troublesome to the heart is almost completely destroyed, and loving service unto the Personality of Godhead is established as an irrevocable fact.",
  "1.2.19": "As soon as irrevocable loving service is established in the heart, the effects of nature's modes of passion and ignorance, such as lust, desire and hankering, disappear from the heart. Then the devotee is established in goodness, and he becomes completely happy.",
  "1.2.20": "Thus established in the mode of unalloyed goodness, the man whose mind has been enlivened by contact with devotional service to the Lord gains positive scientific knowledge of the Personality of Godhead in the stage of liberation from all material association.",
  "1.2.28": "Vāsudeva, or the Personality of Godhead, Śrī Kṛṣṇa, is the cause of all causes. Everything that exists is an emanation from Him, and He is the only enjoyer.",
  "1.3.28": "All of the above-mentioned incarnations are either plenary portions or portions of the plenary portions of the Lord, but Lord Śrī Kṛṣṇa is the original Personality of Godhead.",
  "1.3.38": "Just as the sun alone illuminates all this universe, so does the living entity, one within the body, illuminate the entire body by consciousness.",
  "1.5.11": "That literature which is full of descriptions of the transcendental glories of the name, fame, forms, pastimes, etc., of the unlimited Supreme Lord is a different creation, full of transcendental words directed toward bringing about a revolution in the impious lives of this world's misdirected civilization.",
  "1.5.17": "One who has not listened to the messages about the prowess and marvelous acts of the Personality of Godhead and has not sung or chanted loudly the worthy songs about the Lord should be considered to possess earholes like the holes of snakes and a tongue like the tongue of a frog.",
  "1.7.5": "Śrī Vyāsadeva saw the Absolute Truth, the Personality of Godhead, along with His external energy, which was under full control. By knowing the Absolute Truth, one also knows māyā, which acts upon the conditioned souls.",
  "1.7.6": "The material miseries of the living entity, which are superfluous to him, can be directly mitigated by the linking process of devotional service. But the mass of people do not know this, and therefore the learned Vyāsadeva compiled this Vedic literature, Śrīmad-Bhāgavatam, which is in relation to the Supreme Truth.",
  "1.8.25": "My Lord, Your Lordship can easily be approached, but only by those who are materially exhausted. One who is on the path of material progress, trying to improve himself with respectable parentage, great opulence, high education and bodily beauty, cannot approach You with sincere feeling.",
  "1.8.26": "My obeisances are unto You, who are the property of the materially impoverished. You have nothing to do with the actions and reactions of the material modes of nature. You are self-satisfied, and therefore You are the most gentle and are master of the monists.",
  "1.9.39": "At the moment of death, let my ultimate attraction be to Śrī Kṛṣṇa, the Personality of Godhead. With eyes fixed on Him, I surrendered my arrows upon the battlefield of Kurukṣetra. He is the object of my meditation at the time of death.",
};

/**
 * Look up a verse by its reference string.
 * Accepts formats like "BG 2.13", "SB 1.2.6", "bg 4.7", etc.
 * Returns the translation text or empty string if not found.
 */
export function lookupVerse(ref: string): string {
  const normalized = ref.trim().toUpperCase();

  // BG lookup
  if (normalized.startsWith("BG")) {
    const num = normalized.replace(/^BG\s*/, "");
    return bgVerses[num] || "";
  }

  // SB lookup
  if (normalized.startsWith("SB")) {
    const num = normalized.replace(/^SB\s*/, "");
    return sbVerses[num] || "";
  }

  // Brahma-saṁhitā lookup
  if (normalized.startsWith("BS")) {
    const num = normalized.replace(/^BS\s*/, "");
    return bsVerses[num] || "";
  }

  // CC Madhya-līlā lookup
  if (normalized.startsWith("CC-MADHYA")) {
    const num = normalized.replace(/^CC-MADHYA\s*/, "");
    return ccMadhyaVerses[num] || "";
  }

  return "";
}

/**
 * Get all available verse references for a given book abbreviation.
 */
export function getAvailableVerses(bookAbbr: string): string[] {
  if (bookAbbr === "BG") return Object.keys(bgVerses).map((k) => `BG ${k}`);
  if (bookAbbr === "SB") return Object.keys(sbVerses).map((k) => `SB ${k}`);
  if (bookAbbr === "BS") return Object.keys(bsVerses).map((k) => `BS ${k}`);
  if (bookAbbr === "CC-Madhya") return Object.keys(ccMadhyaVerses).map((k) => `CC-Madhya ${k}`);
  return [];
}

/**
 * Get all verses in a chapter.verse range for a given book.
 * Returns array of { ref, text } objects.
 */
export function getVersesInRange(
  bookAbbr: "BG" | "SB" | "BS" | "CC-Madhya",
  startCh: number,
  startVerse: number,
  endCh: number,
  endVerse: number
): { ref: string; text: string }[] {
  const db = bookAbbr === "BG" ? bgVerses : bookAbbr === "SB" ? sbVerses : bookAbbr === "CC-Madhya" ? ccMadhyaVerses : bsVerses;
  const results: { ref: string; text: string }[] = [];

  for (const [key, text] of Object.entries(db)) {
    // Parse key like "3.19" or "1.2.6"
    const parts = key.split(".").map(Number);
    let ch: number, verse: number;
    if (bookAbbr === "SB" && parts.length === 3) {
      // SB format: canto.chapter.verse — for Canto 1 matching, use chapter.verse
      ch = parts[1];
      verse = parts[2];
    } else {
      ch = parts[0];
      verse = parts[1];
    }

    // Check if within range
    const afterStart = ch > startCh || (ch === startCh && verse >= startVerse);
    const beforeEnd = ch < endCh || (ch === endCh && verse <= endVerse);

    if (afterStart && beforeEnd) {
      results.push({ ref: `${bookAbbr} ${key}`, text });
    }
  }

  return results;
}
