import type { BracketCityPuzzle } from '~/types'

/**
 * Bracket City puzzles drawn from the Ghanshyam Bal Charitra — one for every
 * story in the ten-part set.
 *
 * Solving the last bracket always leaves a summary of that story, which is why
 * these are the whole daily rotation: a generated puzzle can only ever finish
 * on a list of words. The summaries they retell are in
 * `content/ghanshyam-bal-charitra/SUMMARIES.md`, and the full text of each
 * story sits alongside it.
 *
 * To add one: write a sentence, wrap each answer's clue in square brackets with
 * `::answer` at the end, and nest a bracket inside another clue wherever one
 * answer explains the next. The play page shows the story title above the
 * board, so no answer may be a word from its own title, and a clue must never
 * name an answer the player has not reached yet. Run
 * `node scripts/validateBracketCity.mjs` to check all of that.
 */
export const CHARITRA_BRACKET_CITY_PUZZLES: BracketCityPuzzle[] = [
  {
    id: 'charitra-1-curse-of-durvasa-becomes-a-boon',
    title: 'The Curse of Durvasa Becomes a Boon',
    credit: 'Ghanshyam Bal Charitra, Part 1',
    published: true,
    source: 'Demons were tormenting the people of [the country, also called India, whose gods could bear the sight no longer::Bharat], so they gathered at [the heavenly abode where they came before [the Lord who met them in his double form of Nar and Narayana::Purshottamnarayana|Purshottam Narayana]::Badrikashram] — and when the sage Durvasa arrived late and ungreeted he condemned them all to be born on earth and hounded there by the wicked, until [the devout brahmin who stepped forward with his wife [the woman who pleaded at his side::Murtidevi] to beg forgiveness::Dharmadev] moved him to promise that God would be born among them too, as the baby [the name that child was given, which turned a punishment into a blessing::Ghanshyam].'
  },
  {
    id: 'charitra-1-surbhi-the-heavenly-cow',
    title: 'Surbhi the Heavenly Cow',
    credit: 'Ghanshyam Bal Charitra, Part 1',
    published: true,
    source: 'Surbhi, the loveliest of all the cows in [the heaven where the herds give [what tastes of nectar and honey and washes every sorrow away::milk]::Gaulok], wore garlands of [what tinkled at her neck and ankles wherever she walked::bells], and one day the holy music of [the village in India, a few miles from [the town on the Manorama river beside it::Ayodhya], that drew her down to earth::Chhapaiya] called her away from the skies — down to a village whose [how many virtues its very name counts::six] virtues carry it along like the wheels beneath a [what rolls along on its wheels and carries you where you are going::chariot].'
  },
  {
    id: 'charitra-1-birth-of-ghanshyam',
    title: 'Birth of Ghanshyam',
    credit: 'Ghanshyam Bal Charitra, Part 1',
    published: true,
    source: 'On an April night in 1781, in [the village seven miles up the [river running past Ayodhya::Manorama] from Ayodhya::Chhapaiya], a son was born to the brahmin [the father, whose own name means religion::Dharmadev] and his wife [the mother, whose own name means devotion::Bhaktimata], and his divinity showed at once: the [creatures that woke in the middle of the night and began to sing::birds] gave him away, a soft wind carried the scent of flowers through the lanes, and the villagers came with [what they lit to find their way to the house::lamps] to crowd around the child, who was named for holding the whole essence of [the lord whose dark colouring he shared::Krishna], and stayed to sing and dance till morning.'
  },
  {
    id: 'charitra-1-kalidutt-the-evil-one',
    title: 'Kalidutt the Evil One',
    credit: 'Ghanshyam Bal Charitra, Part 1',
    published: true,
    source: 'Unable to bear that so pure a child had been born, the asura sent his army of [ugly black witches who flew screaming to the house and carried the baby off::Krutiyas] to destroy him among the trees of the [fruit grove where they laid him down on a pile of leaves::mango orchard] — but the child only laughed at them, the [what they lit around him, which turned back and burned them instead::fire] caught them, and their cries reached [the flying monkey god, son of [the lord of the wind::Pawan], who happened to be passing overhead::Hanuman], who put out the flames, hurled the witches back at their master for the beating he deserved, and carried the baby home to [the mother he told to call on him whenever she had need::Bhaktimata].'
  },
  {
    id: 'charitra-1-naming-of-ghanshyam',
    title: 'The Naming of Ghanshyam',
    credit: 'Ghanshyam Bal Charitra, Part 1',
    published: true,
    source: 'His father’s name meant religion and his mother’s meant devotion, and to draw up the baby’s birth-chart they called in [the astrologer and scholar of the [ancient scriptures he had mastered::Vedas] who was said to hold Time itself under his control::Markandeya], who counted on his fingers, found the moon sign [the fourth zodiac sign, the one we call Cancer::Karka], and offered the name [what he proposed first, a name of Vishnu::Hari], then [what he tried next, for eyes as deep as the sky::Neelkantha], before settling at last on the name that means dark as the [what his colouring recalled, and what showers blessings on the earth::rain clouds] — then broke into a chant that the whole gathering took up.'
  },
  {
    id: 'charitra-1-ghanshyams-first-test',
    title: 'Ghanshyam’s First Test',
    credit: 'Ghanshyam Bal Charitra, Part 1',
    published: true,
    source: 'At two and a half months old the baby was set down to crawl toward a low [seat his father had draped with a [square of cloth spread over it so the three objects could rest there::silk handkerchief|handkerchief]::stool] holding a [round piece of money standing for wealth::gold coin], a [weapon standing for power and battle::sword] and a [bundle of pages standing for learning::book] — and he let the glitter and the blade alone, since neither is worth anything without [what learning leads to, the greatest gift of all::wisdom], and leafed happily through the pages instead, so his parents knew he would be a devotee of [the goddess of learning::Saraswati] and would lead mankind out of ignorance into knowledge.'
  },
  {
    id: 'charitra-1-ghanshyam-and-moon-uncle',
    title: 'Ghanshyam and Moon Uncle',
    credit: 'Ghanshyam Bal Charitra, Part 1',
    published: true,
    source: 'One night the wakeful baby lifted his arms to [the shining night-time friend that every child in the world calls their [the mother’s brother, a baby’s first little word said twice over::Mama]::Chandamama] and invited him down to play, and he came into the [rocking bed the baby lay in::cradle] until two lights seemed to glow there together — the brightness woke [the mother who got up and lifted her son out::Bhaktimata], who asked him to let his playmate go home, or the rest of the world would be left [what every night would be if that friend never returned to the sky::dark] — so the visitor left, promising to watch over all children, and sang the baby to sleep with his silvery [what he showered down on the drowsy child::rays].'
  },
  {
    id: 'charitra-2-dance-of-narad',
    title: 'The Dance of Narad',
    credit: 'Ghanshyam Bal Charitra, Part 2',
    published: true,
    source: 'Watching from the heavens with Narad, [the lord who kept the beat on his [small two-headed drum he tapped while the sage danced::damroo]::Shankar] and [the celestial singer who chanted along with him::Tumbaroo] came down to the cradle in [the village where the family lived::Chhapaiya] while the baby clapped in time, and [Ghanshyam’s elder brother, who came home with the servant Vashram and bowed low::Rampratap] offered the three lords [fruit he brought out for them before they rose again::bananas], leaving the child still clapping to music nobody else could hear.'
  },
  {
    id: 'charitra-2-sheshnag-and-the-well',
    title: 'Sheshnag and the Well',
    credit: 'Ghanshyam Bal Charitra, Part 2',
    published: true,
    source: 'While his cousin sister [who had wandered off after a [bright insect she was chasing across the yard::butterfly] instead of watching him::Balwantabai] looked away, Ghanshyam crawled up the wall and dropped into the dark water — but the many-headed [creature who lives at the centre of the earth::cobra|snake|serpent] rose in a rush and spread his [what the falling child landed gently upon::hood], so that when [Ghanshyam’s mother::Bhaktimata] and [the elder brother who knew the scene from a dream of Krishna at [the forest town of the cowherds::Vrindavan]::Rampratap] peered down they saw the baby sitting safely, and lifted him out.'
  },
  {
    id: 'charitra-2-universe-in-ghanshyam',
    title: 'The Universe in Ghanshyam',
    credit: 'Ghanshyam Bal Charitra, Part 2',
    published: true,
    source: 'Feeding her baby in the warm sunlight until he grew drowsy, [his mother::Bhaktimata] glanced into the open [what a wide [sleepy stretch of the jaws::yawn] laid bare::mouth] and was pulled into a vision of everything that exists — [the four-faced creator god::Brahma], Vishnu and Shiva blessing her, the mountains, the [how many oceans lay spread out below::seven] seas and nine continents, then the [lights and planets wheeling in unearthly colours::stars] — until, dizzy, she shut her eyes and opened them on a knowing smile, and understood that her child was God.'
  },
  {
    id: 'charitra-2-visit-of-vairajpurus',
    title: 'The Visit of Vairajpurus',
    credit: 'Ghanshyam Bal Charitra, Part 2',
    published: true,
    source: 'A giant [holy man in ochre robes::sadhu] came to the verandah, asked the sleeping baby which gods had already come to him, and — delighted by the silent answer — left [playthings he set down in the cradle::toys] in the cradle and tied a sacred silk [what he knotted round the wrist to keep the child from harm::thread] before setting off for the fair at [the lake where the mela was held::Shravan]; at a pool near Agiyara the brahmin [who was astonished at the giant’s size and hurried back to Chhapaiya with [Ghanshyam’s father::Dharmadev]::Ramdutt] found the boy asleep and glowing with [what convinced him the child was the Lord::light].'
  },
  {
    id: 'charitra-2-ghanshyam-gets-his-ears-pierced',
    title: 'Ghanshyam Gets His Ears Pierced',
    credit: 'Ghanshyam Bal Charitra, Part 2',
    published: true,
    source: 'At seven months old the baby was held on his mother’s lap under the [tamarind that shaded the ceremony::Amli] tree, but a blinding [what burst out and made the piercer drop his [thin needle meant for the lobe::wire]::light] flashed and the child vanished, reappearing high on a [part of the tree he perched on, out of reach::branch]; each time [the elder brother who climbed up after him::Rampratap] got near he flashed back into his mother’s arms, until [she who coaxed him down with a lump of sweet [raw sugar he could not refuse::jagri]::Bhaktimata] fed him and he sat still and let the job be finished.'
  },
  {
    id: 'charitra-2-ghanshyam-and-the-asura',
    title: 'Ghanshyam and the Asura',
    credit: 'Ghanshyam Bal Charitra, Part 2',
    published: true,
    source: 'A demon found the baby alone in his [woven bed he was snatched from::cradle], swooped down and carried him up into the sky — but the fearless child swelled until he had the whole [what he took on so that his captor was dragged down::weight] of the world, and the monster fell dead into the [woodland where the body was found::forest] near [the village whose people ran out to it with the shepherds of Satwa::Surval]; [the monkey god who had slipped away from guard duty to [what he had gone off to do::eat]::Hanuman] saw the corpse from the air and hurried to the house to beg forgiveness, and the people of [the village where the family lived::Chhapaiya] came to marvel at the miracle.'
  },
  {
    id: 'charitra-2-ghanshyam-and-the-rattles',
    title: 'Ghanshyam and the Rattles',
    credit: 'Ghanshyam Bal Charitra, Part 2',
    published: true,
    source: '[Ghanshyam’s mother::Bhaktimata] had tied the bright noisy toys well above the [woven bed where he lay::cradle], out of his reach, and left him alone while she worked in the [room where she was cooking::kitchen] — so the baby stared upward until his [limbs that stretched longer and longer::arms] reached all the way to them and his [what closed around the toys and pulled them down::fingers] brought them to his mouth; hearing the noise, she wondered aloud who could have helped him, and [Ghanshyam’s father, who had watched the whole thing from the [open porch he was sitting on::verandah]::Dharmadev] told her that nothing was impossible for their little lord.'
  },
  {
    id: 'charitra-2-two-goddesses',
    title: 'The Two Goddesses',
    credit: 'Ghanshyam Bal Charitra, Part 2',
    published: true,
    source: '[The goddess of learning, whose company the child kept as he sang along with the evening [lamp-waving hymn his mother offered::aarti] and grabbed at the [writing tool his father dipped in ink::pen]::Saraswati] was never away from Ghanshyam, so [the jealous goddess of wealth::Lakshmi] sent a friend in the shape of a [small bird that called him out to the verandah::sparrow] — and when [his mother, afraid it would peck him::Bhaktimata] threw a [what she flung over the bird, which at once turned into a woman::cloth] over it, the visitor picked the baby up and asked why he kept only one such friend, and his [what he answered her with, promising he would need her badly one day::eyes] won her blessing.'
  },
  {
    id: 'charitra-3-ghanshyam-reveals-himself',
    title: 'Ghanshyam Reveals Himself',
    credit: 'Ghanshyam Bal Charitra, Part 3',
    published: true,
    source: 'As [the mother feeding her baby in the shade of the [open porch where she sat catching the breeze::verandah]::Bhaktimata] scolded a [small brown bird whose beating wings had startled the child::sparrow] for frightening him, a voice she heard only in her [where his answer reached her, though his lips never moved::mind] told her that nothing could ever harm him — he was Aksharatit and Purna Purshottam, she was Bhakti herself, his father was [the name he gave Dharmadev, meaning religion::Dharma], and his elder brother was really [the serpent lord whose incarnation Rampratap was::Sankarshan] — and she wept with wonder as she held him.'
  },
  {
    id: 'charitra-3-has-ghanshyam-drowned',
    title: 'Has Ghanshyam Drowned?',
    credit: 'Ghanshyam Bal Charitra, Part 3',
    published: true,
    source: 'Swimming with his friends in [the lake they splashed about in on a hot day::Meensagar], Ghanshyam sank to the bottom, sat cross-legged and slowed himself until he needed no [what a boy underwater must surface for::breath], so the panicking boys fetched the village, certain he had gone under or been seized by a [scaly beast that lurked in the lakes of those days::crocodile]; feeling their fear, he rose and stood upon the surface, then walked ashore without leaving a single [little ring the water should have shown at each step::ripple], and while [the mother who begged him never to frighten her so again::Bhaktimata] clung to him, [the father who took a solemn promise from him::Dharmadev] made him swear never to swim without [the elder brother he was to keep beside him::Rampratap], and the villagers bent to touch his [what they reached down to in reverence::feet].'
  },
  {
    id: 'charitra-3-lord-of-light',
    title: 'Lord Of Light',
    credit: 'Ghanshyam Bal Charitra, Part 3',
    published: true,
    source: 'A blaze poured out of the baby’s [spot on his tummy that his mother’s tickling fingers had found::navel] and filled the world, and out of it stepped [the four-armed messenger who came with [the second of the two heavenly visitors::Bhumapurush]::Chaturbuj] to tell the family that [the God the message named, now born in their own house::Purshottam] had taken birth as their child; later, feeding him on the [open porch where she sat with him::verandah], [his mother::Bhaktimata] saw the same brilliance stream from his [short thick finger she was staring at::thumb] and was afraid, until he told her in her mind that he had chosen birth from her because in an earlier life she had worshipped him as though he were her own [what she had once treated him as, and what he now truly was::son], and her devotion grew deeper every day.'
  },
  {
    id: 'charitra-3-twelve-mothers-of-ghanshyam',
    title: 'The Twelve Mothers Of Ghanshyam',
    credit: 'Ghanshyam Bal Charitra, Part 3',
    published: true,
    source: 'Burning with [the illness that left her too weak to feed him::fever], Bhaktimata could not quiet her hungry baby, and [the elder brother who rocked the [woven bed he had been laid back in::cradle] for a while before going off to bathe at the [water where he would later meet the visitors on their way home::lake]::Rampratap] left him crying loudly enough to be heard in the heavens — so twelve heavenly women came down, and [the one who lifted him first and promised he would not go hungry::Shrada] fed him before each of the others took her turn, until [the father who came home to find them standing over his sleeping wife::Dharmadev] woke her, the women bowed and filed out, and the child told her in her mind that he had called them because she was too ill to feed him.'
  },
  {
    id: 'charitra-3-signs-in-the-palm',
    title: 'The Signs In The Palm',
    credit: 'Ghanshyam Bal Charitra, Part 3',
    published: true,
    source: 'Unable to read the strange marks on her baby’s hand, Bhaktimata called over [the father, whose own name means religion::Dharmadev], who picked out a [water flower opening on the skin::lotus], a [banner shape beside it::flag] and an [elephant goad, the third of the marks::Ankush]; then a light burst from the little hand and blinded them all, and when they opened their eyes [the Lord seated on a white [patch of land ringed by water::island]::Vasudev] stood before them, telling [the elder brother he named as an incarnation of Sankarshan::Rampratap] that the baby was Purshottam Narayan, born to bring enlightenment to millions, before bowing to the child, blessing him and vanishing.'
  },
  {
    id: 'charitra-3-open-your-mouth',
    title: 'Open Your Mouth!',
    credit: 'Ghanshyam Bal Charitra, Part 3',
    published: true,
    source: 'While the women cooked, [the aunt who sat on the verandah picking the grit out of a dish of [white grains that would be boiled for dinner::rice]::Chandanbai] slipped off her [glass rings she set down on the floor beside her::bangles], and Ghanshyam threw one out into the [patch of ground beyond the verandah::garden] to make her play with him; when she told him to fetch it himself he crawled after it and pushed a handful of [what glinted in the sun and went into his mouth instead::earth|soil|mud|sand] between his lips, and as she picked it out she saw the whole [everything that exists, wheeling inside a baby::universe] in there — but [his mother, who had seen the very same vision long before::Bhaktimata] only smiled at the news.'
  },
  {
    id: 'charitra-3-bath-of-the-gods',
    title: 'The Bath Of The Gods',
    credit: 'Ghanshyam Bal Charitra, Part 3',
    published: true,
    source: 'Invisible on the wall of the family [deep shaft the household drew its water from::well] sat [the four-faced creator::Brahma], Vishnu and [the god who rides the bull Nandi::Shiva], and the moment Bhaktimata went indoors for [what she hurried to fetch, since the first bucket had scalded him::cold water], they came down and washed the boy themselves; she returned to find him already clean, was sent inside for a [cloth he asked her to bring to dry him::towel], found him in there dressed and jewelled while three men still scrubbed him outside, and thought she was going [what a mother might believe of herself, seeing her son in two places at once::mad], until the three told her that her son was the creator of all things and they had only wanted to be near him, and rose into the [where they went as they vanished::sky].'
  },
  {
    id: 'charitra-3-first-haircut',
    title: 'The First Haircut',
    credit: 'Ghanshyam Bal Charitra, Part 3',
    published: true,
    source: 'At [how many years old he was when the custom allowed it::three] the boy was taken to [the lake named for the Lord, where a brahmin sprinkled water and chanted::Narayan] lake for his holy bath, but the cold [blade that had been sharpened in the sunlight::razor] scraped his head and hurt, so he raised his arm and vanished from the eyes of the [man crouching over him with the job half done::barber] alone, who sat baffled while everyone else could still see him — until [the god who came down to the shore with his wife [the goddess riding beside him::Parvati] on the bull [the beast the two of them rode::Nandi]::Shiva] told him not to tease a poor workman, since the lord of all things feels [what he need not suffer unless he chooses to::pain] only if he wishes, and the boy understood, reappeared and told the man to cut it all off.'
  },
  {
    id: 'charitra-4-demon-storm',
    title: 'The Demon Storm',
    credit: 'Ghanshyam Bal Charitra, Part 4',
    published: true,
    source: 'On the day of his first [cutting away of his hair, which he threw afterwards into the water::haircut] on the bank of the [lake named for the Lord, where the barber and the priest sat with the family::Narayan lake|Narayan|Narayan Lake], an [evil being who joined the playing children in the shape of a small boy::asura] was seen through at once and burned by a [scorching look out of the child’s eyes::glare], so he flew up and whipped rain and thunder out of the sky, cracking a [what his bolt split in two::tree] over the head of the meditating child — but the boy sat unharmed among the broken branches, opened his eyes on the black [what his gaze pierced overhead::clouds], and sent a shaft of [what struck his enemy dead, after which the [what came out again over a quiet sky::sun] shone::lightning] back down.'
  },
  {
    id: 'charitra-4-never-a-dull-moment',
    title: 'Never A Dull Moment',
    credit: 'Ghanshyam Bal Charitra, Part 4',
    published: true,
    source: 'Sent to a cow-herder for the evening [what the family bought each day, and what the little one would not sit down to a meal without::milk], [Ghanshyam’s elder brother::Rampratap] found he had left his money at home and was turned away — so Ghanshyam, reading his thoughts from indoors, put a second form of himself outside the cow-herder’s door and pressed a [round piece of money::coin] into his hand, astonishing [the mother who watched two of her sons come home while one of them still sat inside::Bhaktimata]; and later a [chattering raider who came leaping down from a branch::monkey] that grabbed a [flat round bread::chappati] off her very dish was frozen still as a statue for [how many days it hung in the [where it stayed stuck fast, silent among the leaves::tree] before he took pity::three] days, and came down humbled to touch his feet.'
  },
  {
    id: 'charitra-4-monkeys-meet-their-match',
    title: 'The Monkeys Meet Their Match',
    credit: 'Ghanshyam Bal Charitra, Part 4',
    published: true,
    source: 'While his mother walked off to the [where she went to fill her water pot::well], a thieving animal leapt down and snatched the [flat bread she had been feeding him with a spoonful of [soured milk eaten alongside it::curd]::chappati] out of his hand on the [open porch where he sat at breakfast::verandah], so Ghanshyam stretched his [limbs that grew longer and longer until they reached the branch::arms] up, seized the creature and threw it to the ground — and when the whole neighbourhood’s troop swarmed in to defend it he multiplied himself into as many forms as there were enemies and chased them into the trees with [what every one of those forms picked up to drive them off::sticks], leaving [his father, who walked in on two armies facing each other::Dharmadev] laughing that a beast who has taken [blessed food from the Lord’s own hand::prasad] must be a great man in his next life.'
  },
  {
    id: 'charitra-4-mango-fight',
    title: 'The Mango Fight',
    credit: 'Ghanshyam Bal Charitra, Part 4',
    published: true,
    source: 'Passing ripe golden fruit down from a tree beside the Narayan lake to his friend [the small boy who stacked it in a tidy pile on the ground::Veniram], Ghanshyam watched a [swaggering older boy who helped himself to that pile and slapped his friend::bully] from a party of [boys of the priestly caste, come down to bathe::brahmin] boys take the lot — so he leaned out and lifted the [clay vessel off the boy’s shoulder, along with the [cord for lowering it into a well::rope] coiled beside it::water pot], then vanished and reappeared among the [parts of the tree he flitted between until every older boy had climbed up after him::branches], where he and his friends pelted them with fruit until they begged to come down, apologised, touched his [what they bent to in shame::feet] and gathered the whole crop for them.'
  },
  {
    id: 'charitra-4-ghosts-in-the-well',
    title: 'The Ghosts In The Well',
    credit: 'Ghanshyam Bal Charitra, Part 4',
    published: true,
    source: 'Driven out by the raiders of the [wicked ruler in Ayodhya who seized cattle and children from the villages::Nawab], the family sheltered with friends at [the village where they were warned never to draw water after dark::Tinva], and when [the mother who forgot that warning one thirsty evening::Bhaktimata] felt cold hands clutching at her [what she had tied to a beam to lower her pot::rope] she fled shrieking to the house — so Ghanshyam climbed down into the blackness after the spirits, who drew back burned from the [what his body gave off down there::light], confessed they were [dice-players killed in a drunken brawl with the [armed men they had been drinking alongside::soldiers]::gamblers] shut out of [where their sins had barred them from going::heaven], and were blessed and released, after which nobody in that village feared the water again.'
  },
  {
    id: 'charitra-4-ghanshyam-runs-away',
    title: 'Ghanshyam Runs Away',
    credit: 'Ghanshyam Bal Charitra, Part 4',
    published: true,
    source: 'At the family farm at [the village they had all come to before the rains::Targam], the boy who loved to eat ripe [the tall crop they were putting in, sown alongside cucumbers::corn] hated to plant it, and scattered the [what he flung about anyhow instead of setting it in the ground::seed] until the hired workers complained — so [his elder brother, who came over and raised a hand to slap him::Rampratap] was stopped by the sight of a glowing four-armed form of God and begged forgiveness; still hurt, the boy slipped out before dawn, and the search reached as far as [the home village he was thought to have gone back to::Chhapaiya] before a villager reported him at an old [what he was found sitting at the bottom of::well], where an apology brought his [what he stretched up, longer and longer, until they could be grasped::arms] within reach and he was hauled out.'
  },
  {
    id: 'charitra-4-ghanshyam-and-the-fish',
    title: 'Ghanshyam And The Fish',
    credit: 'Ghanshyam Bal Charitra, Part 4',
    published: true,
    source: 'At the [place he had come for a swim with his friends::Meensagar lake|Meensagar] Ghanshyam wept to see the catch tipped out to gasp on the shore, and with a wave of his hand sent every one of them flipping back into the [element they could breathe in again::water] — so the [anglers who advanced on him, furious, for setting their catch free::fishermen] were faced with the black and towering [form he took on, a weapon in each of his [how many hands he had::eighteen] hands::god of Death|Yamraj|Yama|Death], who carried them off to a burning kingdom where [creatures with scorching hands who fell on them there::demons] tormented them until they could bear no more, and set them back on the sand begging forgiveness and swearing to burn their [what they promised never to cast again::nets], having learned that to harm any creature of his is a [what he told them such cruelty is::sin].'
  },
  {
    id: 'charitra-4-ghosts-and-the-jack-fruit',
    title: 'The Ghosts And The Jack Fruit',
    credit: 'Ghanshyam Bal Charitra, Part 4',
    published: true,
    source: 'Two [night visitors who crept in and plucked the giant ripening crop::thieves] carried their haul out of the family [walled plot behind the house where the tree stood::garden] to rest by the Narayan lake in the [pale light they sat under::moonlight], meaning to sell it next day at the [where they planned to carry it in the morning::market] — but Ghanshyam saw it all from his bed and called on the spirits of a [sacred tree of heart-shaped leaves that they lived in::peepal] tree, who terrified the pair into lugging every one of them back to his [porch where he sat waiting::verandah], where they begged forgiveness and bolted into the night; and for their help the spirits had their old sins forgiven and their [what he released from the earth, to rise and find peace at [the heavenly abode they went up to::Badrik Ashram|Badrikashram]::souls] set free.'
  },
  {
    id: 'charitra-5-at-the-mela',
    title: 'At The Mela',
    credit: 'Ghanshyam Bal Charitra, Part 5',
    published: true,
    source: 'Refused a place on the long journey to the holy fair at [the town, where many [waters that flow together there::rivers] meet, that the pilgrims were walking to::Harihar], the boy left one body asleep in his bed and sent another outside to call down [the giant eagle who bowed his head and carried him there overnight::Garuda] — and when [his father, who had said the road was far too long for a small boy::Dharmadev] dipped under the water for his holy bath he saw his son standing there as God, with [how many arms were stretched out towards him::four] arms; the child wandered the stalls all day, vanished at evening, and days afterwards the two of them sat an astonished [his mother, who was certain the boy had been at home with her the whole time::Bhaktimata] down and told her the whole story.'
  },
  {
    id: 'charitra-5-ghanshyam-and-the-divine-horse',
    title: 'Ghanshyam And The Divine Horse',
    credit: 'Ghanshyam Bal Charitra, Part 5',
    published: true,
    source: 'Boasting at the [lake where the boys sat astride mango branches pretending to ride::Narayan] lake that their make-believe mounts were quicker than his, Ghanshyam’s friends watched his branch turn into a living beast with [how many heads it tossed as it galloped::seven] heads that thundered past lake and village, scaring the women drawing water at every [deep shaft where they dropped their brass [round vessels they balanced on their heads::pots] and ran::well], while the [holy men bathing at the water’s edge, who raised their hands in praise::brahmins] blessed the sight — then he waved it away, sat back on his branch, and every boy agreed that his was the [what they all called it, quicker than any of theirs::fastest].'
  },
  {
    id: 'charitra-5-rainy-day',
    title: 'The Rainy Day',
    credit: 'Ghanshyam Bal Charitra, Part 5',
    published: true,
    source: '[His mother, who held his little hands and clapped while he wobbled::Bhaktimata] was teaching the baby to [what she was helping him do on his own two feet::stand] in the garden when the [downpour out of dark clouds that soaked even the verandah::rain] drove them indoors and left him crying — so [the four-faced creator::Brahma], Sharda and [the wandering sage who sat on the floor and played his [stringed instrument he carries everywhere::veena] in time with the drumming on the roof::Narad] came down to play games with him, and when the sun came out again they bowed low and returned to the [where the three of them went home to::skies].'
  },
  {
    id: 'charitra-5-feet-of-the-lord',
    title: 'The Feet Of The Lord',
    credit: 'Ghanshyam Bal Charitra, Part 5',
    published: true,
    source: 'While Dharmadev read the [holy book of Krishna’s teaching to Arjuna::Bhagwad Gita|Gita|Bhagwat Geeta] aloud to his brother-in-law Vashram, [the aunt who had taken the baby into her lap to play::Sundari] noticed strange marks on his soles, and his mother counted [what the right one carried — a flag, a lotus, a grain of rice and more, in this number::nine] symbols there, with seven on the other foot; then a blinding [what streamed out of the child and spread across the whole earth::light] filled the garden, and [the lord who appeared enthroned within it among the [heavenly ones crowded around his throne::gods]::Lakshminarayan|Laxminarayan] told the father that [the supreme God himself, come to earth for the good of mankind::Purshottam] had been born as his son, worshipped the little boy, and laid him back in his aunt’s lap.'
  },
  {
    id: 'charitra-5-ghanshyam-is-hungry',
    title: 'Ghanshyam Is Hungry',
    credit: 'Ghanshyam Bal Charitra, Part 5',
    published: true,
    source: 'Left on the floor still unfed while his mother picked the dust out of the [grain she was cleaning in a winnowing basket for lunch::rice], the baby crawled out to the [open porch beyond the front door::verandah], stood at the edge and tumbled down the steps — then told [the woman who came running from the kitchen and caught him up::Bhaktimata] with his [what he answered her in, without speaking a word aloud::mind] that he was not hurt and had only pretended, since as [the supreme God he truly was::Purshottam] he would never fall unless he chose to, so she warmed him sweetened [what she fed him from a [shallow dish she poured it into::saucer] as a treat::milk] and rocked him to sleep in his cradle.'
  },
  {
    id: 'charitra-5-lord-of-all-things',
    title: 'The Lord Of All Things',
    credit: 'Ghanshyam Bal Charitra, Part 5',
    published: true,
    source: '[The white-robed lord who releases the pure from birth after birth and sends them up to [the heavenly abode they are freed into::Akshardham]::Satwagunabhimani] came to the cradle and offered to do whatever the baby asked, so Ghanshyam teased him by asking why his own [what had never once been set free in all his many births::soul] had never been released — and was told that every power the visitor held came from God, and that many would be purified now that the Lord had come to earth; then, offered [what he promised to fire at any evil [demons who might come to trouble the child::asuras]::arrows], Ghanshyam laughed that his [what alone could burn evil up, with no weapon at all::thoughts] were enough, so the visitor asked [the monkey god::Hanuman] to watch over him instead.'
  },
  {
    id: 'charitra-5-surbhi-and-her-calf',
    title: 'Surbhi And Her Calf',
    credit: 'Ghanshyam Bal Charitra, Part 5',
    published: true,
    source: 'Steadying himself on a little three-wheeled wooden toy as he learned to [what it was helping him do around the compound::walk], Ghanshyam was licked by a young calf that had wandered in through the entrance, and behind it came its mother Surbhi, the heavenly [animal with the softest coat, whose [what she had come down to feed him::milk] is divine::cow], sent from [the heaven of the herds, which she returned to when she was done::Gaulok] to feed him; already full, he promised to call on her whenever he grew [what he said he would be when he called her::hungry], so she licked his [part of him she blessed with her tongue before going::head] and led her little one home, leaving [the nurse who had had that toy made for him and watched it all in amazement::Chandanbai] holding him close.'
  },
  {
    id: 'charitra-5-ghanshyam-gets-plastered',
    title: 'Ghanshyam Gets Plastered',
    credit: 'Ghanshyam Bal Charitra, Part 5',
    published: true,
    source: 'Cleaning the house before [the festival of lights the whole village was preparing for::Diwali], Bhaktimata knelt to smooth a plaster of mud and [what she mixed it with, brought straight from the cattle shed::cow-dung|dung|cowdung] over the floors while the baby, left alone next door, crawled back to her with his ankle [what tinkled at every movement as he came::bells] ringing; he plunged both hands into her big cane basket and smeared himself from head to foot, and once she had scolded him a [woodworker who had called at the house asking for [Ghanshyam’s eldest brother::Rampratap]::carpenter] lifted the crying, muddy child to carry him out to [his father, reading under his favourite tree in the garden::Dharmadev] — only to find him growing so impossibly [what he became in the man’s arms, until he had to be set down::heavy] that he declared the boy no ordinary child, after which his mother laughed with him all through a bath at the well.'
  },
  {
    id: 'charitra-6-demon-camp',
    title: 'The Demon Camp',
    credit: 'Ghanshyam Bal Charitra, Part 6',
    published: true,
    source: 'While [the father who had gone off with Rampratap to buy clothes at the [place they walked to for the day::market]::Dharmadev] was away, a band of asuras dressed as [what they disguised themselves as, pitching tents with horses and elephants in the field::soldiers] lifted the sleeping baby out of his [rocking bed they emptied without waking his mother::cradle], blackened the sky and rained [what fell out of the darkness to scatter the watching villagers::arrows] so that they could dance around him chanting for his death — but Ghanshyam opened his eyes and gazed on them with [the one thing evil cannot bear to look at::love], and every one of them burned down to a smouldering pile of [what was left of them lying about the field::ash|ashes], and [the monkey god who came down too late for a fight and carried the child home::Hanuman] had to take his disbelieving mother out to the field to see the proof.'
  },
  {
    id: 'charitra-6-escaping-from-the-nawabs-soldiers',
    title: 'Escaping from the Nawab’s Soldiers',
    credit: 'Ghanshyam Bal Charitra, Part 6',
    published: true,
    source: 'Sensing that the cruel Nawab’s riders were coming again to steal cattle and children, Ghanshyam’s [the old man of the family who first felt them on their way::grandfather] called for a lookout, so Ghanshyam grew taller than the trees and saw their dust far off to the [direction the horses were riding in from::north] — and all of [the boy’s own village::Chhapaiya] gathered their cows and buffaloes and fled towards [the place they made for to take shelter::Nabpur]; resting under a [broad shady tree with roots hanging down from its branches::banyan] tree, Rampratap found a [deep shaft where his bucket was no use without a [cord to lower it, which nobody had brought::rope]::well], so Ghanshyam stretched his hands over the dark and the [what climbed up inch by inch until it reached the brim::water] rose to be drunk by everyone.'
  },
  {
    id: 'charitra-6-guarding-ghanshyam',
    title: 'Guarding Ghanshyam',
    credit: 'Ghanshyam Bal Charitra, Part 6',
    published: true,
    source: 'His auntie [who came over from the village of [where she and her friends had travelled from::Targam] with a coat, a cap and a shawl::Vasantabai] also brought a bag of sugar [things he sucked happily in her lap all evening::sweets], and after sitting in the breeze under the big [tamarind tree in the garden::amli] the family lay down to sleep outdoors, where his uncle [the one still awake and gazing at the stars::Vashram|Vaishram] made out a huge figure bending over the sleeping boy and nudged [the father who leapt up and demanded to know who the stranger was::Dharmadev] — and when the shape stepped forward into the light of the [what showed them his face at last::moon] it was [the monkey lord, come to protect his master from harm::Hanuman], who blessed the two men and rose into the sky to watch over the child all night.'
  },
  {
    id: 'charitra-6-crocodile-asura',
    title: 'The Crocodile Asura',
    credit: 'Ghanshyam Bal Charitra, Part 6',
    published: true,
    source: 'On the day of the night with no [what is missing from the sky on Somvati Amavasaya::moon] the family went down with a brahmin priest to bathe in the [river they had come to for the ritual dip::Saryu], and as the boy ducked under, [the demon lying in wait there as a huge crocodile, who caught him up in his [what a hunting reptile snaps its catch away in::jaws]::Gayadutt] carried him off into the deep water — but Ghanshyam rose again astride the beast and drove it towards the [edge of the water where his family stood praying::shore], where his brother [the elder son, who leapt in and grappled with it::Rampratap] took the form of [the serpent lord whose strength he borrowed::Sheshnarayan] and smashed the giant dead on the sand, and the people bent to touch their [what they reached down for in praise of the two brothers::feet] as the fame of both spread far and wide.'
  },
  {
    id: 'charitra-6-wrestling-match',
    title: 'The Wrestling Match',
    credit: 'Ghanshyam Bal Charitra, Part 6',
    published: true,
    source: 'Watching the famous strongmen who had come down from [the mountain country north of India::Nepal] practising on the bank at [the bathing steps near Ayodhya where the boys were playing::Ramghat], Ghanshyam gave his frightened friends the strength and courage of [the largest beasts that walk the earth::elephants], and they dashed the visitors to the ground; so the king’s three jealous [young relatives of his who arranged a contest for a royal prize::nephews] sent in the giant [the strongest of the three, who dared anyone to pull him down by the [iron fixed round his ankles for the pulling::chain]::Bhimsang], whom the boy toppled with a single tug, then stood unmoved in his turn until the metal snapped and flung the wrestler against a tree, breaking his [what he nursed as he left the ring in shame::arm] — and the king hung a [ring of flowers he was crowned with::garland] round his neck and gave him a fine shawl.'
  },
  {
    id: 'charitra-6-khampa-talavadi',
    title: 'The Khampa Talavadi',
    credit: 'Ghanshyam Bal Charitra, Part 6',
    published: true,
    source: 'Sitting by the [still water the boys often visited, where [the wise old man who read to them from the [epic of Ram and Sita he studied all day long::Ramayana]::Haridas] sat meditating::pond], the boys threaded the fallen Kadamb and Kevda blossoms into garlands until Ghanshyam looked exactly like [the cowherd lord he was dressed up as::Krishna], and his soft whistling imitation of that lord’s [instrument whose music calls a herd in::flute] brought the [beasts that came mooing across the neighbouring field::cows] crowding round, sending his friends scrambling up a tree; he waved them back, but a broken branch tore his leg on the way down, and once a doctor had bound it with a strip off [the friend who gave up his shirt for a bandage::Veniram]’s back, he lifted the cloth to show his frightened parents that the [what had healed away to nothing but the faintest scar::wound] was gone, and the pond has been named for that miracle ever since.'
  },
  {
    id: 'charitra-6-jamun-tree',
    title: 'The Jamun Tree',
    credit: 'Ghanshyam Bal Charitra, Part 6',
    published: true,
    source: 'When the fruits ripened the boys raced off to the [land belonging to [the man whose orchard they raided::Anand Tarwadi]::farm], where Ghanshyam climbed up and jumped on the branches until a [colour the fallen harvest stained their tongues and lips::purple] litter lay on the ground for the others to gather up and eat; then the [orchard guard who came running at them with his [wooden club, raised high over the boy::stick]::watchman] scattered the lot of them and caught hold of Ghanshyam, who was not frightened in the least but seized the man’s [limb he took in his own free hand::arm], whirled him round and let him go, so that he struck a trunk and lay there senseless — and at home his brother [the elder one, first scolded for running off and leaving him::Rampratap] heard the story out, amazed and proud.'
  },
  {
    id: 'charitra-6-dont-kill-animals',
    title: 'Don’t Kill Animals!',
    credit: 'Ghanshyam Bal Charitra, Part 6',
    published: true,
    source: 'When [the disease that was carrying off people all over the village::cholera] broke out, the villagers decided the angry Mother had sent it, herded [the beasts they meant to offer up to her::goats] to her temple and hired a [man of witchcraft who danced about waving a huge [blade he was to do the slaughtering with::sword]::Bhuva] — but Ghanshyam ran to the spot, snatched the weapon out of his hands and took on the shape and voice of the [divine Mother herself, standing huge and fierce in front of them all::Goddess], who forbade the sacrifice, warned that blood spilled in her name turns her into an [evil demon she has no wish to become::asura], said the sickness had come only because God willed it, and sent them off to pray to Ghanshyam Maharaj instead; then he was a boy again, and that same day he appeared in many [what he took in every house at once to cure the sick::forms] throughout [the village of his birth::Chhapaiya].'
  },
  {
    id: 'charitra-7-be-generous',
    title: 'Be Generous',
    credit: 'Ghanshyam Bal Charitra, Part 7',
    published: true,
    source: 'Not one [long green salad vegetable ripening on the [climbing stems it grows along::vines]::cucumber] on the farm of [Ghanshyam’s uncle, who tasted them one after another and threw each one down in disgust::Vashram] was anything but bitter, yet the boy came home with a whole basket of sweet ones — so when his [the wife who scolded him for wasting the crop and forbade him the fields::aunt] complained the plants shrivelled and died, teaching the family that what God gives God can also [what the withering proved he can do just as easily::take away]; the boy was invited back, and that year the [golden cobs that grew again for every single one he plucked::corn] multiplied so richly that baskets of it went to all their [the neighbours who shared in that harvest::friends].'
  },
  {
    id: 'charitra-7-all-are-equal',
    title: 'All Are Equal',
    credit: 'Ghanshyam Bal Charitra, Part 7',
    published: true,
    source: '[The family cow, Ghanshyam’s special friend, who nudged him gently with her nose::Gomti] gave three or four litres of [creamy white drink she filled the pail with morning and evening::milk] a day until [Ghanshyam’s [what the wife of an elder brother is to him::sister-in-law|sister in law], who did the milking and the serving::Suvasini] poured out far more for [the elder brother she favoured that morning::Rampratap] than for the boy, after which the cow gave almost nothing — so [the mother who explained that the animal loved her youngest and had been hurt::Bhaktimata] told her to share whatever there was equally, and when she [what she did at the next milking, promising never to do it again::apologised|apologized|said sorry|sorry] the [vessel she milked into::bowl] filled right up to the brim.'
  },
  {
    id: 'charitra-7-ghanshyam-and-the-giant-pumpkin',
    title: 'Ghanshyam And The Giant Pumpkin',
    credit: 'Ghanshyam Bal Charitra, Part 7',
    published: true,
    source: 'A friend at [the village where the vegetable was plucked from a garden and handed over::Loghangeri] gave [Ghanshyam’s father, who huffed and puffed and could barely raise it off the ground::Dharmadev] and his eldest son a gourd so huge that a [hired man sent along to carry it all the way to [the family’s own village::Chhapaiya]::servant] was needed to bring it home, and when [the mother who watched her youngest try to roll it about like a football::Bhaktimata] told him it was far too big for him to lift, he picked it up with godly strength and caught it on the tip of his [smallest of the five on his hand::little finger|littlest finger], then stood before them all as [the blue lord whose pose he took, one leg crossed over the other::Krishna] holding up the mountain of [the hill of trees and temples and grazing cattle that the vegetable had become::Govardhan|Mount Govardhan], until the vision faded and they knew at last who he really was.'
  },
  {
    id: 'charitra-7-ghanshyam-the-scholar',
    title: 'Ghanshyam The Scholar',
    credit: 'Ghanshyam Bal Charitra, Part 7',
    published: true,
    source: 'In just [how many days it took him::seventeen] days the boy learnt [how many subjects he mastered by heart::fourteen] subjects, and the four [men of the priestly caste who came to test his knowledge and could not catch him out::brahmins] went away sure that he was divine; then, after a holy bath at Ramghat, he gently corrected the misreadings of [the proud old pandit reading aloud in the shade, too weak-sighted to get the [epic of Rama he was stumbling through::Ramayana] right::Valmiki], who shouted him down — so [the monkey god who appeared in a flash of light and bowed before the boy::Hanuman] declared him to be [the supreme Lord himself, born on earth to save it::Purna Purshottam|Purna Purushottam|Purushottam] and struck the old man [what a ray from that raised hand left him, until he crawled up begging forgiveness::blind], whereupon the boy took pity and restored his sight.'
  },
  {
    id: 'charitra-7-ghanshyam-and-the-sweets-shop',
    title: 'Ghanshyam And The Sweets Shop',
    credit: 'Ghanshyam Bal Charitra, Part 7',
    published: true,
    source: 'Longing for something sweet and having no [what he had none of in his pocket to buy any with::money], the boy quietly took the [gold band his sister-in-law had slipped off her [what she bared before starting on the vegetables::finger] and left lying on a kitchen shelf::ring] and traded it to the [shrewd trader who held it up to the light and promised him all he could eat::shopkeeper], who was certain so small a child could manage very little — yet plate after plate of [golden balls, the first kind to vanish down him::ladoos|ladoo|laddoos] went the same way until the whole place was bare; then, finding [the weeping owner of the lost band::Suvasini] at home in tears, he ran back and offered to return everything, and when the man laughed and agreed the [what he turned his head to see, stacked and glistening exactly as before::shelves] were full again and the band was given back.'
  },
  {
    id: 'charitra-7-on-the-road-to-targam',
    title: 'On The Road To Targam',
    credit: 'Ghanshyam Bal Charitra, Part 7',
    published: true,
    source: 'On the long dusty walk to a sacred thread ceremony [the mother who grew faint with thirst in the shade of a forest tree::Bhaktimata] sent [her elder son, who searched high and low and came back with nothing::Rampratap] out to hunt for water, and when Ghanshyam pointed him to a spot he had already walked across there stood a [deep shaft brimming with the coolest, clearest water she had ever tasted::well]; that evening his grasp of the four [ancient scriptures whose essence he explained, along with the eighteen Puranas::Vedas] so astonished [their host, the father-in-law of the elder brother::Baldev Prasad|Baldev Prashad] that he pressed [the father, who agreed to hold a second ceremony later at [the holy city where the mother had wanted it held::Ayodhya]::Dharmadev] into letting the boy take the thread next morning beside [the host’s own son, whose ceremony it was to have been::Lakshmi Prasad|Laxmi Prasad|Lakshmi Prashad].'
  },
  {
    id: 'charitra-7-kings-soldiers',
    title: 'The King’s Soldiers',
    credit: 'Ghanshyam Bal Charitra, Part 7',
    published: true,
    source: 'Bathing at the pond beside an ashram in [the city they had spent all day shopping in for the ceremony::Ayodhya], the boy watched the [sweet golden fruit borne by the tree they were felling::mango] tree topple and pin [how many were caught and left groaning beneath it::five] of the king’s men to the ground, and levered it off them with nothing but a small [stick he pushed underneath and leaned on::cane]; summoned to court and laughed at as far too little, he walked forward casting no [dark shape every body throws when it stands in the light::shadow] and turned up the soles of his [what bore the [how many marks of the Lord were counted there::sixteen] holy symbols::feet], whereupon the king bent to touch them and sent him home with silk, an embroidered coat and a necklace of [what the strung beads of that gift were::pearls].'
  },
  {
    id: 'charitra-7-at-the-temple-of-krishna',
    title: 'At The Temple Of Krishna',
    credit: 'Ghanshyam Bal Charitra, Part 7',
    published: true,
    source: 'That same evening, after the rescue, the family walked round the shrine at [the quarter of the city where it stood::Kunjgalli] in [the reverent circling done barefoot before going inside::parikrama] and entered during [the evening ritual in which the [small flame waved in circles before the altar::lamp|oil lamp] is offered::aarti|arti], and as the boy gazed the [stone figure of the Lord that the little flame had lit up::idol|murti] began to move, rising and growing into the full living form of Lord Krishna, who folded his hands, knelt and touched the boy’s [what he bowed down to in reverence::feet], then went back to his [seat he settled onto, resuming his carved form::throne] — and the whole crowd, the [man who fell back astonished as the figure began to rise::priest] among them, cried “Jai Shri Krishna! Jai Shri Ghanshyam!” and bowed low before the boy.'
  },
  {
    id: 'charitra-8-in-the-soldiers-camp',
    title: 'In The Soldiers’ Camp',
    credit: 'Ghanshyam Bal Charitra, Part 8',
    published: true,
    source: 'Taken by [the brahmin of Chhapaiya whose own name means religion::Dharmadev] to visit his two soldier brothers in the Nawab’s army at [the huge park where the tents and the tethered rows of animals stood::Badki Gardens|Badki Garden], Ghanshyam was horrified to find [the frightened creatures, bleating beside the sheep, being butchered for the cooking pots::goats] slaughtered in the camp, so he closed his eyes and [what he did quietly while the horses and [the great beasts that snapped their chains first::elephants] broke loose and stampeded::meditated], driving the [ruler who scrambled up a tree and clung there shaking::king] into the branches — and only after shaking that tree and warning him that killing innocent animals is a terrible [wrong for which he too would be killed::sin] did Ghanshyam raise his [what he lifted to settle every animal at once::arms], bringing the great man down to bow at his feet and ban all killing in his camps.'
  },
  {
    id: 'charitra-8-bad-tempered-elephant',
    title: 'The Bad Tempered Elephant',
    credit: 'Ghanshyam Bal Charitra, Part 8',
    published: true,
    source: 'When the ill-tempered elephant at the [water it was taken down to for its daily bath::lake] turned on the [keeper who had been scrubbing its hide with a [flat smooth thing he rubbed over it::stone]::Mahavat], hurling him into the shallows and charging at him, Ghanshyam — sitting indoors in the house of [Rampratap’s father-in-law, who owned the beast::Baldev Prasad] — saw the danger with his divine sight and sent a [what he projected onto the animal’s back while his first one stayed where it was::second body], which quietened the creature with one [gentle press of his hand on its head::touch] and lifted the man safely onto the bank; the villagers, hurrying out, then saw the boy in two places at once, walking beside them and riding home, and the huge animal knelt and touched his [what it bowed its grey head low to reach and honour::feet] with its [long limb it curls around whatever it lifts::trunk] before the rider on its back faded away.'
  },
  {
    id: 'charitra-8-ghanshyam-and-the-birds',
    title: 'Ghanshyam And The Birds',
    credit: 'Ghanshyam Bal Charitra, Part 8',
    published: true,
    source: 'Sent out to keep the ripening [grain the whole flock had come down to feast on::rice] safe from the birds, Ghanshyam would not let them or [the father who had given him the job::Dharmadev] go hungry, so with a wave and a [cry that rang out across the field::shout] he left every bird [how he fixed them, beaks open mid-song and wings hanging in the air::frozen] and went off to play under a huge [tree his friends were climbing all afternoon::Mahuda], where [his eldest brother, who came to scold him for neglecting his duty::Rampratap] found him and was astounded at the motionless field — and when Ghanshyam [what he did with his hands as his brother bent to lift a little [smallest bird of them all, caught scratching in the dirt::sparrow] out of the dust::clapped], the flock burst into life and flew off in one great cloud, leaving the older boy ashamed to have forgotten that his little brother holds life and death in his hands.'
  },
  {
    id: 'charitra-8-ghanshyam-has-a-toothache',
    title: 'Ghanshyam Has A Toothache',
    credit: 'Ghanshyam Bal Charitra, Part 8',
    published: true,
    source: 'Unable to chew even the [soft sweet dish his sister-in-law cooked specially for him::halwa] for the pain, Ghanshyam let [the young woman married to his elder brother::Suvasini] pull the aching tooth out, then pointed to the next, and the next, until all [how many of them lay in a pile on her [square of cloth she laid each one on::handkerchief]::thirty-two] were gone — but when the terrified girl confessed and [his mother, whose anger she had been dreading::Bhaktimata] opened his mouth, every tooth was whole and in place, so the two women threw the pile up into the air, where each one fell as a shining white [gem an oyster makes, which is what every one of them became::pearl], and a flock of divine [long-necked white birds that swallowed them, bowed low and flew back to the [where they had come down from::heavens]::swans] carried them away.'
  },
  {
    id: 'charitra-8-prasad-of-ghanshyam',
    title: 'Prasad Of Ghanshyam',
    credit: 'Ghanshyam Bal Charitra, Part 8',
    published: true,
    source: 'When his hungry friends wanted to go home from the [water full of fish they had been playing beside all day::pond], Ghanshyam promised to feed them if they stayed, had them knot a [cloth hung by its four corners in the branches of the [tree whose shade they had been playing under::mahuda]::towel] up in the tree and took them all [what they did in the water while they waited::swimming] — and when they clambered out there were [how many shining women stood heaping that cloth with fruits and sweets::eight] angelic women filling it, who sat the boys down and fed them heavenly food on [what the plates they ate off were, and shone like::golden] plates until not one child could swallow another mouthful, then said the thanks belonged to their [the one whose wish they were only carrying out::Lord], bowed to him and [what they did the instant they had bowed::vanished].'
  },
  {
    id: 'charitra-8-gods-want-prasad',
    title: 'The Gods Want Prasad!',
    credit: 'Ghanshyam Bal Charitra, Part 8',
    published: true,
    source: 'Longing to taste food blessed by the boy’s own hand, [the four-faced creator::Brahma] and [the lord who carries a [three-pronged weapon he is never without::trident]::Shiva] slipped into the pond as [creatures that could nibble the scraps off his fingers when he came to wash::fish] — but Ghanshyam, who knows everything, warned his friends that there were [snapping reptiles that might come for a taste of them too::crocodiles] in the pond and had them all wash from a [vessel he scooped it up in instead::bowl]; so the pair came back as [wandering holy men, ash-smeared and barefoot, who live on what is given them::sadhus] to ask for a meal, and were told the food was all finished and sent off to the village, at which they laughed, took their true forms, asked him openly, and were blessed with the [what he filled that vessel with and handed to them::water] they drank before returning to their heavenly abode.'
  },
  {
    id: 'charitra-8-a-wedding-and-a-funeral',
    title: 'A Wedding And A Funeral',
    credit: 'Ghanshyam Bal Charitra, Part 8',
    published: true,
    source: 'At the feast the day after [the friend the family had travelled to the village of Nagipur to see married::Prag] took his vows, Unmath Tarwadi won a fifty-one [unit of Indian money, handed over reluctantly by [the man who had wagered he could never do it::Lalbihari]::rupee] bet by devouring a whole plate of [deep-fried golden breads he dipped in the ghee::puris], half a bucket of [sweet lumps he crunched between them::jageri] and two pots of ghee — and when Ghanshyam warned that eating so much can kill a man, he joked that his little lord could simply bring him back, which is just what happened when he died in the night and Ghanshyam called him down off the [heaped wood his body was carried to at dawn::pyre], alive and full of the beauty of [the heavenly abode he had just come back from::Akshardham], leaving the crowd to see that life and [what the Lord holds in his hands alongside it::death] are his to give.'
  },
  {
    id: 'charitra-8-mischievous-friends',
    title: 'The Mischievous Friends',
    credit: 'Ghanshyam Bal Charitra, Part 8',
    published: true,
    source: 'Ghanshyam and his inseparable playmate [the boy next door whose kitchen they raided as often as his own::Veniram] helped themselves to the [thick soured milk they spooned up along with the jageri::curd] whenever the parents were out and then denied everything, so when the neighbour caught them and came to complain, [Ghanshyam’s mother, who refused to believe a word of it::Bhaktimata] dared her to catch the culprit and tie him up with a [what she should bind him with before calling for witnesses::rope] — and she did, laying a [pretence of leaving the house that lured the two straight back to a big bowl of [white cooking fat they were dipping into::ghee]::trap], binding his hands and calling the whole village to her door; but as she showed him off in the doorway the boy took on her own son’s [what he changed into, so that she stood there gripping her own child::form], and the neighbours roared with [what they all burst into as she untied him in shame::laughter].'
  },
  {
    id: 'charitra-9-sun-at-night',
    title: 'The Sun At Night',
    credit: 'Ghanshyam Bal Charitra, Part 9',
    published: true,
    source: 'When [the elder brother who swore to eat nothing until the sun showed itself again::Rampratap] had gone twelve rainy days without food and was growing dangerously weak, Ghanshyam prayed until [the sun-god of the golden chariot::Surya Narayan|Suryanarayan] came down after dark drawn by seven white [animals harnessed to that chariot, white from nose to tail::horses]; and when his brother would not believe that a sun could shine at midnight, the god blazed until the darkness turned bright as day and named the boy [the title he gave him, higher than all the gods::Lord], so the ashamed brother embraced him and broke the [what he had kept since the [season of rain that had hidden the sky for so long::monsoon] began::fast], while the sun-god streaked home over [the village whose people woke and ran to their windows to watch him go::Chhapaiya|Chappaiya].'
  },
  {
    id: 'charitra-9-ghosts-and-the-mangoes',
    title: 'The Ghosts And The Mangoes',
    credit: 'Ghanshyam Bal Charitra, Part 9',
    published: true,
    source: 'Racing [the elder brother whose team meant to beat his own to the ripe fruit::Rampratap] to see who could wake first, Ghanshyam read his plan to creep out before [what he intended to be up and gone well ahead of::sunrise] and sent the ghosts of the haunted [tree whose heart-shaped leaves shivered above them::peepal] into [the uncle whose mango [walled ground of fruit trees the boys had all set out for::orchard] the two teams were racing towards::Vashram|Vaishram]’s trees to pick the fruit first; the terrified raiders ran home with the spirits pulling at their [what was grabbed at along with their clothes::hair], and found Ghanshyam sitting and laughing beside a mountain of golden fruit, which he blessed and gave out ten at a time as [the blessed food he shared with his ghostly helpers::prasad].'
  },
  {
    id: 'charitra-9-feeding-the-1000-pilgrims',
    title: 'Feeding The 1,000 Pilgrims',
    credit: 'Ghanshyam Bal Charitra, Part 9',
    published: true,
    source: 'When a thousand holy men and their followers from [the mountain kingdom they had walked down from::Nepal] camped by the [lake near his home where they watered their [big grey beasts that had carried their bundles down the passes::elephants]::Khampa Talavadi|Khapa Talavadi] and ran out of food, Ghanshyam led them to [the father who protested that there was nowhere near enough in the house::Dharmadev], who gave in and let them have whatever there was; [the mother who carried out the baskets of vegetables and the pots of ghee::Bhaktimata] and [the sister-in-law who fetched and carried beside her::Suvasini|Suvasinibhabhi] were sent back again and again, and every time they found the [where they had sworn the food was finished, piled high once more::shelves] full, until all thousand had eaten and the monks bowed to touch his [what they reached down for once they had seen God in him::feet].'
  },
  {
    id: 'charitra-9-monk-and-the-tiger',
    title: 'The Monk And The Tiger',
    credit: 'Ghanshyam Bal Charitra, Part 9',
    published: true,
    source: 'Visiting the pilgrims’ camp with [the father who offered to buy it off the old man::Dharmadev], Ghanshyam was saddened by the sight of a holy man seated on a striped [what was left of a beautiful animal killed for it::skin], chopping chillies with his [long blade he was using as a kitchen knife::sword], and asked to have it; the man snapped that a holy man deserved more respect, then demanded three hundred [coins, a sum that showed the [hunger for money no holy man should feel::greed] behind his refusal::rupees] — so with one small gesture the boy brought the hide roaring back to life, told the frightened onlookers that the tiger was angry only at the old man’s [what he had shown before he ever mentioned money::pride], forgave him when he begged on his knees, and sent the great cat bounding free into the [trees it vanished among::forest].'
  },
  {
    id: 'charitra-9-ghanshyam-becomes-a-brahmin',
    title: 'Ghanshyam Becomes A Brahmin',
    credit: 'Ghanshyam Bal Charitra, Part 9',
    published: true,
    source: 'When [the father who fixed an auspicious day for his younger son’s sacred thread ceremony::Dharmadev] took the family to [the holy city where the rite was to be held::Ayodhya], the house was hung with glass lamps, a [cloth roof raised in the compound over a [shady tree with small bitter leaves::neem]::canopy] went up over the [brick pit where the sacred fire was lit and fed with seven kinds of wood::agni kund|agnikund], and a statue of [the elephant-headed god set up indoors before anything else could begin::Ganapati] was installed; but the moment he was dressed as a Brahmachari the boy felt that this was what he had been born for, and he ran off towards the [direction he turned and bolted in::north], leaving [the uncle who chased him and lost him, out of breath::Vashram|Vaishram] far behind — until, sensing how his parents grieved, he came back with a heavy heart to finish the ceremony.'
  },
  {
    id: 'charitra-9-ghanshyam-and-the-mad-boy',
    title: 'Ghanshyam And The Mad Boy',
    credit: 'Ghanshyam Bal Charitra, Part 9',
    published: true,
    source: 'Playing by the [deep shaft in the [patch of ground beside the house where they were all at play::garden] that the boys had gathered round::well], Ghanshyam watched his friends surround a simple lad of [his own village::Chhapaiya|Chappaiya] and jeer at him until the lad’s [woman who stormed in to ask why they were so cruel to a pure and innocent soul::mother] chased every one of them off; seeing that the lad had been a great [holy man of meditation in a life before this one::Yogi], Ghanshyam stood before him in his [godly shape with two more hands than any man has::four-armed form], blessed him so that his troubled mind cleared on the spot, and handed him back to her with the promise that his soul would go straight to [the highest abode, which he would reach when he left this earth::Akshardham].'
  },
  {
    id: 'charitra-9-worldly-sadhu',
    title: 'The Worldly Sadhu',
    credit: 'Ghanshyam Bal Charitra, Part 9',
    published: true,
    source: 'Sitting in the [temple of the monkey god at Ayodhya where the recitation was going on::Hanuman] temple, Ghanshyam listened to [the reciter who taught that a thousand yagnas can never purify a man like going without food::Mohandas] read from the [epic of Ram and Sita he had open before him::Ramayana] until a fat holy man scoffed that bodies are given to us for enjoyment; the boy rose in disapproval and walked his [circuit a devotee makes round a shrine::parikrama], and when the man jeered after him a single burning stare sent him to [the place of the wicked dead, where the [servants of Yamraj who whooped round him and beat him::spirits of death] told him he had insulted God Himself::Yampuri] — from which he came back weeping, promised to practise and preach [what he had mocked, the going without food::fasting], and was forgiven with a brief glimpse of the four-armed form of God.'
  },
  {
    id: 'charitra-9-lucknow-wrestlers',
    title: 'The Lucknow Wrestlers',
    credit: 'Ghanshyam Bal Charitra, Part 9',
    published: true,
    source: 'When brutal giants came down from Lucknow and challenged the [ruler of [the city of Ram’s birth, whose honour was suddenly at stake::Ayodhya], who took up the dare on his old adviser’s word::king] for a solid gold [award of twenty-five kilos, the kind they had carried off from contests all over India::statue], his own men were flung down with shattered [bones cracked by the visitors’ elbows::ribs] within minutes — until Ghanshyam stepped out of the crowd with his young [companions he filled with strength and with [what one look from him gave them, so that they were not afraid::courage]::friends], who dodged and grappled until the giants tired and he lifted their [biggest of them, the one who had made the challenge::leader] high over his head and smashed him to the ground; the delighted ruler embraced him and handed over the prize, and the boy spent every gram of it on serving the [people he cared for more than any award::poor].'
  },
  {
    id: 'charitra-10-crossing-the-river',
    title: 'Crossing The River',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Walking from [the village where Ghanshyam was born::Chhapaiya] to the Ram Navmi fair at [the city whose masons had left blocks along the bank, ruled by [the king who had ordered them for his building works::Darshansingh]::Ayodhya], the family found the [ferrymen who doubled their fare for the crowds::boatmen] filling every boat on the [water they had to get across::Saryu] — so Ghanshyam sat everyone on a block of [what one touch of his finger set floating::stone] and carried them over while onlookers stared in amazement.'
  },
  {
    id: 'charitra-10-flooded-field',
    title: 'The Flooded Field',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Four months of monsoon rain had drowned Moti Tarwadi’s [crop he had sown to feed his family::rice] under the overflowing waters of [the lake his farm sat beside::Bhatiya], so Ghanshyam waded in and pressed his [part of the foot that bored a hole in the soft earth::big toe] down until the flood spun away like a whirlpool — then called [the king of heaven, who swooped down on a winged [vehicle he drove across the sky::chariot]::Indra] to carry the gasping [creatures left flapping among the stalks::fish] to safety and save the harvest.'
  },
  {
    id: 'charitra-10-blind-men',
    title: 'The Blind Men At The Lake',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'On [the fasting day kept on the eleventh of the fortnight::Ekadashi] the family went to bathe at [the water outside the village::Shravan], where a [holy man charging money for the powers God had given him::sadhu] was turning away everyone too poor to pay — so Ghanshyam took his divine form, raised [the number of arms he showed above the beggars::four] arms, gave back their [what those men had never once used::sight] for nothing, and warned the shamed healer never to sell God’s gifts again.'
  },
  {
    id: 'charitra-10-wishing-tree',
    title: 'The Wishing Tree',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Ghanshyam and his friends emptied the pot of [fruit his father had cut up to offer as [food given to God before it is shared out::prasad]::jackfruit], and [the sister-in-law who found the pot empty and told his mother::Suvasini] gave them away — but after a gentle scolding he led her out to the barren tree in the garden, now hanging heavy, and every branch his elder brother [who scoffed and wished aloud for coconuts, bananas and grapes::Ramprasad|Rampratap|Ramapratap] named bore a different fruit for the brothers to gather and offer to God.'
  },
  {
    id: 'charitra-10-mother-earth',
    title: 'The Tears Of Mother Earth',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'On [the winter kite festival::Uttarayan], after bathing at [the lake where the family gave sweets to brahmins and cattle::Narayan], the Earth Mother came before Ghanshyam as a [animal they fed a bowl of halva::cow] and wept at the sins being committed on her body — and [the god of wind and air, who came down from among the kites::Varundev] pointed out the [creatures the fishermen had left dead along the shore::fish], which Ghanshyam sent leaping back alive into the water before promising them both that his mission against [what he had come to rid the world of::evil] would soon begin.'
  },
  {
    id: 'charitra-10-bhaktimata',
    title: 'The Death Of Bhaktimata',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Old and ailing, Bhaktimata asked to be carried home to [the village where her relatives lived::Chhapaiya], fell into fever, and made Ghanshyam promise to obey [the elder brother she left in charge of him::Rampratap|Ramprasad|Ramapratap] and [the sister-in-law she asked to raise the boy as her own son::Suvasini] — then, as he recited from the [scripture he spoke at her bedside::Bhagwad Gita|Gita] and showed her [the divine abode where she saw herself seated beside him::Akshardham], her soul left her body, and her sons carried her to [the lake where they piled up the [wood they set alight beneath her::logs]::Narayan].'
  },
  {
    id: 'charitra-10-dharmadev',
    title: 'The Death Of Dharmadev',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Only days after his wife’s [thirteen-day rite held for the dead::Shraddh], Dharmadev handed the house and farm to [his eldest son, who would later plant two Tulsi shrubs where both his parents were burned::Rampratap|Ramprasad|Ramapratap], told him that Ghanshyam was [the supreme person himself::Purna Purshottam|Purna Purushottam|Purushottam], and asked for the [seven-day reading of the Gita that [the pandit fetched to his bedside::Ramahari] began there::Bhagwat Saptah] — and when he wished aloud to see God in every form, Ghanshyam spread himself into all [the number of incarnations that ringed the bed::twenty-four|24] of them at once, then died chanting, his son alone not weeping because he could see him at peace in [the divine abode above the five universes::Akshardham].'
  },
  {
    id: 'charitra-10-leaves-home',
    title: 'Ghanshyam Leaves Home',
    credit: 'Ghanshyam Bal Charitra, Part 10',
    published: true,
    source: 'Blamed for thrashing the wrestlers who had taunted him outside the [temple of the monkey god who served Ram::Hanuman] temple, Ghanshyam folded his clothes in a pile with his [gold he left on top for his family to find::jewellery|jewelry], bathed in the Saryu and walked away for good as a young holy man carrying [what he told his mantras on, strung from sacred tulsi::prayer beads] and a wooden [what he would beg his food in::alms pot] — and when the asura [who seized him from behind and threw him into the current, avenging [the demon Ghanshyam had destroyed years before::Kalidutt]::Kaushidutt] found him twelve kilometres downstream sitting in meditation beneath a [tree whose shade he had settled under::peepal|pipal|pipul], one look from him turned the demons on each other.'
  }
]
