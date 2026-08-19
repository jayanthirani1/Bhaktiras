#!/usr/bin/env python3
"""Generate the shared game vocabulary.

Only curated Swaminarayan, Gujarati and basic Hinduism terms are included —
no Sahasranama or obscure Sanskrit name dumps.

The generated JSON is committed so the games do not need network access.
Run this script only when intentionally refreshing the bank.

After regenerating, bump WORD_BANK_VERSION in utils/gameStorageReset.ts so
browsers clear cached daily Wordle / Crossword / 1% Club progress.
"""

from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "satsangWordBank.json"

# Familiar everyday vocabulary only. Format: display|clue|category
CURATED = """
Aarti|Worship ceremony performed with lighted lamps|worship
Abhishek|Ritual bathing of a sacred murti|worship
Acharya|A spiritual teacher or guide|satsang
Agna|A spiritual command or instruction|satsang
Ahmedabad|Gujarat city home to the first Swaminarayan mandir|place
Ahimsa|The principle of non-violence|value
Akshar|The eternal abode and ideal devotee of Purushottam|swaminarayan
Akshardham|The divine abode of Bhagwan Swaminarayan|swaminarayan
Amrut|Nectar or that which is immortal|satsang
Anand|Spiritual bliss or joy|hinduism
Anjali|A gesture of reverence with joined palms|worship
Anuvrutti|Following the inner wish of the guru|satsang
Arjun|Warrior taught by Krishna in the Bhagavad Gita|hinduism
Arti|A shorter spelling of the lamp worship ceremony|worship
Ashirwad|A blessing|worship
Ashram|A place for spiritual practice and community|community
Atladra|Swaminarayan pilgrimage centre near Vadodara|place
Atma|The eternal self or soul|hinduism
Atmabuddhi|Deep identification and oneness with the Satpurush|swaminarayan
Avatar|A divine manifestation on earth|hinduism
Ayodhya|Sacred birthplace of Bhagwan Ram|place
Badrinath|Himalayan pilgrimage shrine dedicated to Vishnu|place
Balak|A child|community
Balika|A young girl in satsang|community
Bal Mandal|A satsang group for children|community
Bapa|An affectionate form of address for a revered guru|swaminarayan
Bapu|Affectionate Gujarati address for a respected elder or guru|gujarati
Barfi|A milk-based Indian sweet often offered as prasad|food
Bhagavad Gita|Krishna's sacred teaching to Arjuna|scripture
Bhagwan|The supreme Lord|hinduism
Bhajan|A devotional song or act of worship|worship
Bhajiya|Deep-fried Gujarati snack often shared after sabha|food
Bhakta|A devotee of God|devotion
Bhakti|Loving devotion to God|devotion
Bhasma|Sacred ash used in worship|worship
Bhima|One of the Pandava brothers known for strength|hinduism
Bhog|Food prepared as an offering to God|worship
Bhumi|The earth, revered as a divine mother|hinduism
Bhuj|Town in Kutch with a historic Swaminarayan mandir|place
Bochasan|Swaminarayan pilgrimage town in Gujarat|place
Brahma|The deity associated with creation|hinduism
Brahmacharya|Self-restraint and purity|hinduism
Chaas|Gujarati buttermilk drink|food
Chaitra|A month in the Hindu lunar calendar|festival
Chakra|A wheel or sacred discus symbol|hinduism
Chandan|Sandalwood paste used in worship|worship
Chandlo|The round red mark worn on the forehead|swaminarayan
Charan|The feet, especially of God or the guru|devotion
Charanarvind|The lotus feet of God|devotion
Chaturmas|Four holy monsoon months of added observance|festival
Chesta|Verses describing Bhagwan Swaminarayan's divine form|swaminarayan
Chhapaiya|Birthplace of Bhagwan Swaminarayan|place
Chutney|Spiced accompaniment served with Indian food|food
Dal|Lentil dish common in Gujarati meals|food
Damaru|The small drum associated with Shiva|worship
Darshan|Reverent sight of God, a murti, or a holy person|worship
Dasbhav|The humble attitude of being God's servant|devotion
Daya|Compassion|value
Deep|A lighted lamp used in worship|worship
Deepavali|The festival of lights|festival
Deva|A deity or divine being|hinduism
Devaki|Mother of Krishna|hinduism
Devotee|One who is devoted to God|devotion
Dhanteras|Festival day welcoming auspicious prosperity|festival
Dharma|Righteous conduct and sacred duty|hinduism
Dhokla|Steamed Gujarati snack made from fermented batter|food
Dholak|A hand drum used in devotional music|worship
Dhoti|Traditional lower garment worn by men|gujarati
Dhun|Repetitive chanting of God's name|worship
Dhyan|Meditation and focused remembrance|worship
Diksha|Formal spiritual initiation|satsang
Divyabhav|Seeing the divine qualities of God and the Satpurush|swaminarayan
Diwali|The Hindu festival of lights|festival
Draupadi|Wife of the Pandavas in the Mahabharata|hinduism
Durga|The powerful mother goddess|hinduism
Dussehra|Festival celebrating the victory of dharma|festival
Dwarka|Krishna's sacred coastal city in Gujarat|place
Ekadashi|A sacred fasting day on the eleventh lunar day|festival
Ekantik Dharma|Dharma, jnan, vairagya and bhakti together|swaminarayan
Fafda|Crispy Gujarati snack often eaten with jalebi|food
Gadhada|Town where many Vachanamrut discourses were delivered|place
Ganesh|The elephant-headed remover of obstacles|hinduism
Ganga|India's sacred river|place
Garbhagruh|The innermost shrine of a mandir|worship
Garuda|The eagle-like vehicle of Vishnu|hinduism
Gayatri|A revered Vedic mantra|worship
Ghanthi|A knot, often referring to a spiritual resolve|gujarati
Ghanshyam|Childhood name of Bhagwan Swaminarayan|swaminarayan
Ghanta|A temple bell rung during worship|worship
Ghar Sabha|A regular spiritual assembly held at home|community
Ghee|Clarified butter used in food and rituals|food
Girnar|Sacred mountain in Gujarat|place
Gita|Sacred dialogue between Krishna and Arjuna|scripture
Gnan|Spiritual knowledge|hinduism
Gokul|Village associated with Krishna's childhood|place
Goloka|The divine abode associated with Krishna|place
Gondal|Gujarat town with a Swaminarayan mandir|place
Gopi|A devotee remembered for pure love of Krishna|hinduism
Gopuram|Monumental gateway of a Hindu temple|worship
Govardhan|The sacred hill lifted by Krishna|place
Govinda|A beloved name of Krishna|hinduism
Grihastha|The householder stage of life|hinduism
Gujarat|Western Indian state of Swaminarayan origins|place
Gunatit|Beyond the three gunas|swaminarayan
Gunatitanand|The first spiritual successor of Bhagwan Swaminarayan|swaminarayan
Guru|A spiritual teacher who dispels ignorance|satsang
Guru Bhakti|Devotion to the spiritual guru|swaminarayan
Guru Purnima|Festival honouring the spiritual teacher|festival
Gurukul|A traditional place of learning with a guru|community
Hanuman|Ram's devoted servant, known for strength and bhakti|hinduism
Hari|A beloved name of God|hinduism
Haribol|A joyful call to chant God's name|hinduism
Havan|A sacred fire ceremony|worship
Holi|Spring festival of colour|festival
Jagannath|A celebrated form of Krishna|hinduism
Jay|An exclamation of victory or praise|worship
Jalaram|Gujarati saint renowned for service and hospitality|gujarati
Jalebi|Spiral sweet often paired with fafda|food
Janmashtami|Festival celebrating Krishna's birth|festival
Japa|Repetition of a divine name or mantra|worship
Japmala|Rosary used for repeating God's name|worship
Jayanti|A sacred birth anniversary celebration|festival
Jetpur|Gujarat town linked with Swaminarayan history|place
Jiva|An individual eternal soul|hinduism
Jnan|Knowledge of the self and God|hinduism
Junagadh|Gujarat city near Girnar|place
Jyot|A sacred flame or lamp|worship
Kadhi|Yogurt-based Gujarati curry|food
Kailash|Sacred mountain abode associated with Shiva|place
Kalash|A sacred water vessel used in rituals|worship
Kaliyug|The present age in the cycle of yugas|hinduism
Kanthi|Double-stranded necklace worn by Swaminarayan devotees|swaminarayan
Karma|Action and its moral consequence|hinduism
Karyakar|A volunteer worker in satsang|community
Katha|A spiritual discourse on scripture|satsang
Kedarnath|Himalayan pilgrimage shrine dedicated to Shiva|place
Khes|A shawl or wrap worn in Gujarati tradition|gujarati
Khichdi|Simple rice and lentil dish|food
Kirtan|A devotional hymn or song|worship
Kishore|A teenage boy in satsang|community
Kishori|A teenage girl in satsang|community
Krishna|The divine teacher of the Bhagavad Gita|hinduism
Krupa|Grace|value
Kumkum|Red powder used for auspicious forehead marks|worship
Kurukshetra|Field where the Bhagavad Gita was taught|place
Kutch|Region of Gujarat with deep Swaminarayan roots|place
Ladoo|A round Indian sweet commonly offered as prasad|food
Lakshmi|Goddess associated with prosperity|hinduism
Lassi|Sweet or salty yogurt drink|food
Lila|A divine act or sacred episode|hinduism
Loj|Village where Nilkanth Varni met Ramanand Swami|place
Mahabharata|Epic containing the Bhagavad Gita|scripture
Mahadev|A revered name of Shiva meaning great God|hinduism
Mahant|A senior sadhu or spiritual leader|satsang
Mahapuja|An extended communal form of worship|worship
Maharaj|A respectful title for a spiritual leader|satsang
Mahashivratri|Festival night devoted to Shiva|festival
Mahila|A woman; also a satsang group for women|community
Mahima|Understanding divine glory and greatness|devotion
Makar Sankranti|Harvest festival also known as Uttarayan|festival
Mala|Rosary beads used for mantra repetition|worship
Mandal|A local satsang group or centre|community
Mandir|A Hindu temple|worship
Mantra|Sacred words repeated in prayer or meditation|worship
Mathura|Sacred birthplace of Krishna|place
Maya|That which causes attachment and spiritual ignorance|hinduism
Modak|Sweet traditionally offered to Ganesh|food
Moksha|Liberation from rebirth and maya|hinduism
Mridang|A double-headed drum used in devotional music|worship
Murti|A sacred image or embodied form of a deity|worship
Narayan|A name of the supreme Lord|hinduism
Narnarayan|The divine pair worshipped at Ahmedabad|swaminarayan
Navratri|Nine-night festival honouring the divine mother|festival
Nilkanth|Youthful name of Bhagwan Swaminarayan during his travels|swaminarayan
Nischay|Firm conviction in God|devotion
Nitya Puja|Daily personal worship|worship
Niyam|A spiritual rule or daily observance|satsang
Omkar|The sacred sound Om|worship
Pagh|A traditional turban worn in Gujarat|gujarati
Palitana|Jain and Hindu pilgrimage town in Gujarat|place
Panchamrut|Fivefold sacred mixture used in abhishek|worship
Pandava|One of the five righteous brothers in the Mahabharata|hinduism
Parabrahman|The supreme God, Purushottam|swaminarayan
Paramatma|The supreme self or God|hinduism
Paramhansa|A sadhu of the highest renounced order|swaminarayan
Parikrama|Walking reverently around a sacred object or shrine|worship
Parshad|An initiated renunciant dressed in white|swaminarayan
Pedha|A milk sweet often offered as prasad|food
Pradakshina|Clockwise circumambulation during worship|worship
Pragat|Manifest and present|swaminarayan
Pramukh|One who leads or presides|swaminarayan
Pramukh Swami|Fifth spiritual successor of Bhagwan Swaminarayan|swaminarayan
Prarthana|A heartfelt prayer|worship
Prasad|Food sanctified by offering it to God|worship
Prasadi|Something sanctified through association with God|swaminarayan
Prem|Selfless spiritual love|value
Puja|Ritual and personal worship|worship
Punya|Spiritual merit from righteous action|hinduism
Puri|Deep-fried flatbread|food
Purushottam|The supreme person, beyond all other realities|swaminarayan
Radha|Beloved devotee associated with Krishna|hinduism
Rajkot|Major Gujarat city with a large Swaminarayan presence|place
Raksha Bandhan|Festival celebrating a protective bond|festival
Ram|The righteous king and avatar celebrated in the Ramayana|hinduism
Ramanavami|Festival celebrating the birth of Bhagwan Ram|festival
Ramayana|Epic recounting the life of Bhagwan Ram|scripture
Rangoli|Decorative floor art made for auspicious occasions|festival
Rishi|An inspired sage or seer|hinduism
Rotli|Soft Gujarati flatbread|food
Rudraksha|Sacred seed beads associated with Shiva|worship
Sabha|A spiritual assembly|community
Sadachar|Moral and disciplined conduct|value
Sadhak|An aspirant following a spiritual path|satsang
Sadhana|Disciplined spiritual practice|satsang
Sadhu|A holy renunciant|satsang
Sadhvi|A female renunciant|satsang
Saffron|Colour associated with renunciation and holiness|satsang
Samadhi|A state of deep spiritual absorption|hinduism
Samagam|Spiritual association with saints and devotees|satsang
Sampraday|A religious tradition or fellowship|community
Samsara|The cycle of worldly birth and death|hinduism
Sanchalak|A coordinator or organiser in satsang|community
Sankalp|A solemn spiritual resolve|worship
Sant|A saint or holy person|satsang
Sanstha|An organised religious fellowship|community
Sarangpur|Major Swaminarayan pilgrimage centre in Gujarat|place
Saraswati|Goddess associated with learning and the arts|hinduism
Sarovar|A sacred lake or reservoir|place
Satpurush|The God-realised saint who guides seekers|swaminarayan
Satsang|Holy fellowship and association with truth|swaminarayan
Satsangi|A member of the satsang fellowship|community
Satya|Truth|value
Sev|Crispy chickpea noodle snack|food
Seva|Selfless voluntary service|devotion
Sevak|One who serves|devotion
Shaak|Gujarati vegetable curry|food
Shakti|Divine power, often personified as the goddess|hinduism
Shangar|Adornment of a murti|worship
Shankh|A conch shell sounded during worship|worship
Shanti|Peace|value
Sharad Purnima|Autumn full-moon festival|festival
Shastra|A sacred or authoritative scripture|scripture
Shikhar|The towering spire of a mandir|worship
Shikshapatri|Bhagwan Swaminarayan's code of conduct|swaminarayan
Shirdi|Pilgrimage town associated with Sai Baba|place
Shiva|The deity associated with transformation|hinduism
Shivling|Sacred symbol worshipped as Shiva|worship
Shlok|A verse from a sacred scripture|scripture
Shraddha|Faith and reverence|devotion
Shrawan|A month of special devotion in the Hindu calendar|festival
Shreeji Maharaj|A loving name for Bhagwan Swaminarayan|swaminarayan
Sinhasan|The throne or seat for a murti|worship
Sita|Ram's devoted consort in the Ramayana|hinduism
Somnath|Ancient jyotirlinga pilgrimage shrine in Gujarat|place
Sukhdi|Sweet Gujarati prasad made with wheat flour and ghee|food
Surya|The sun deity|hinduism
Swabhav|One's ingrained nature or habit|hinduism
Swadharma|Living according to one's righteous duty|hinduism
Swami|A title for a spiritual master or renunciant|satsang
Swaminarayan|Bhagwan Swaminarayan and his sacred mantra|swaminarayan
Swarup|Divine form or essential nature|hinduism
Swastik|Ancient auspicious Hindu symbol of wellbeing|worship
Tapa|Religious austerity|satsang
Tapasya|Spiritual austerity and disciplined effort|satsang
Tej|Divine radiance|hinduism
Thaal|A plate of food offered to God with devotion|worship
Thepla|Spiced Gujarati flatbread|food
Tilak|The U-shaped sacred mark worn on the forehead|swaminarayan
Tilak Chandlo|The forehead marks worn by Swaminarayan devotees|swaminarayan
Tirth|A sacred pilgrimage place|place
Tithal|Coastal Swaminarayan pilgrimage place in Gujarat|place
Torana|Decorative gateway or auspicious door hanging|festival
Tridev|The divine triad of Brahma, Vishnu and Shiva|hinduism
Trishul|The trident associated with Shiva|hinduism
Tulsi|Holy basil revered in Hindu worship|worship
Undhiyu|Traditional Gujarati mixed-vegetable dish|food
Upanishad|A philosophical scripture of the Vedas|scripture
Upasana|The doctrine and practice of worship|swaminarayan
Utsav|A sacred celebration or festival|festival
Uttarayan|Gujarati kite festival marking the sun's northward path|festival
Vachanamrut|Principal collection of Bhagwan Swaminarayan's discourses|swaminarayan
Vadtal|Swaminarayan pilgrimage town in Gujarat|place
Vaikunth|The divine abode associated with Vishnu|place
Vairagya|Detachment from worldly pleasures|hinduism
Varanasi|Ancient sacred city on the Ganga|place
Vasant|The spring season|festival
Vartal|A principal Swaminarayan pilgrimage town|place
Vato|Spiritual talks or discourses|swaminarayan
Veda|Ancient revealed Hindu scripture|scripture
Vedas|The four foundational revealed scriptures|scripture
Vishnu|The all-pervading preserver|hinduism
Vivek|Spiritual discrimination between right and wrong|value
Vrat|A religious vow or fast|worship
Vrindavan|Sacred place of Krishna's childhood lilas|place
Yagna|A sacred offering or sacrifice|worship
Yamuna|Sacred river associated with Krishna|place
Yashoda|Krishna's loving foster mother|hinduism
Yatra|A sacred pilgrimage journey|worship
Yoga|A disciplined path toward spiritual union|hinduism
Yogi|One who practises yoga and spiritual discipline|satsang
Yogiji Maharaj|Fourth spiritual successor of Bhagwan Swaminarayan|swaminarayan
Yuga|A great age in the Hindu cycle of time|hinduism
Yuvak|A young man in satsang|community
Yuvati|A young woman in satsang|community
Aasan|A seat or posture used in worship and yoga|worship
Ambaji|Popular mother-goddess pilgrimage place in Gujarat|place
Ashtak|A set of eight verses in praise of God|scripture
Bhaktiyoga|The path of loving devotion|hinduism
Bhajanmandali|A group that sings bhajans together|community
Brahmanand|A celebrated poet-sant of the Swaminarayan tradition|swaminarayan
Chaitanya|Spiritual awareness or divine consciousness|hinduism
Chorasi|A traditional gathering or group of eighty-four|community
Dandvat|Full-body prostration before God or a murti|worship
Divo|A small oil lamp used in Gujarati homes and mandirs|gujarati
Gadi|The spiritual seat or throne of a tradition|satsang
Ghee lamp|A lamp fuelled by clarified butter for aarti|worship
Harijan|A loving servant of God|devotion
Harikrishna|A beloved name of Bhagwan Swaminarayan|swaminarayan
Jay Swaminarayan|The greeting used among Swaminarayan devotees|swaminarayan
Katha varta|Spiritual storytelling and discourse|satsang
Kirtankars|Devotees who lead kirtan singing|community
Mahaprasad|Food that has been offered and shared as blessing|worship
Manan|Quiet reflection on spiritual teaching|satsang
Mangal aarti|Early-morning aarti performed at the mandir|worship
Mukta|A liberated soul|hinduism
Mukti|Liberation|hinduism
Nitya|Eternal or daily|hinduism
Panchang|The Hindu calendar used for festivals and observances|hinduism
Prarthana sabha|A prayer assembly|community
Rajbhog|The midday food offering to God|worship
Ramanand Swami|Guru of Bhagwan Swaminarayan|swaminarayan
Sadhuta|The quality of saintliness|satsang
Sahajanand|A sacred name of Bhagwan Swaminarayan|swaminarayan
Sandhya aarti|Evening aarti performed at dusk|worship
Sant samagam|Gathering in the company of saints|satsang
Sarva|All or everything, as in all-pervading God|hinduism
Sharanagati|Complete surrender to God|devotion
Shayan aarti|Night-time aarti before resting the murti|worship
Shravan|Listening attentively to spiritual discourses|satsang
Siddhanta|Core doctrine of a spiritual tradition|satsang
Smruti|Sacred remembrance or remembered tradition|hinduism
Sneha|Affectionate spiritual love|value
Stotra|A hymn of praise|scripture
Thakorji|Affectionate name for the murti of God|swaminarayan
Tyag|Renunciation|hinduism
Tyagi|One who has renounced worldly life|satsang
Utsahi|An enthusiastic devotee|community
Vandan|Respectful salutation|worship
Vidya|Knowledge or learning|hinduism
Vishay|Worldly sense-object|hinduism
Vruti|Tendency of the mind|hinduism
Yagna kund|Fire pit used for a havan|worship
Yuva Mandal|Satsang group for young adults|community
""".strip()


def answer_for(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Za-z]", "", ascii_value).upper()


def game_flags(answer: str) -> list[str]:
    games = []
    if len(answer) == 5:
        games.append("wordle")
    if 3 <= len(answer) <= 15:
        games.append("crossword")
    return games


def add_entry(
    rows: list[dict],
    seen: set[str],
    display: str,
    clue: str,
    category: str,
    source: str,
) -> None:
    answer = answer_for(display)
    clue = re.sub(r"\s+", " ", clue).strip().rstrip(".")
    if len(answer) < 3 or len(answer) > 24 or not clue:
        return
    if answer in seen:
        return
    seen.add(answer)
    rows.append(
        {
            "id": f"word-{len(rows) + 1:04d}",
            "answer": answer,
            "display": re.sub(r"\s+", " ", display).strip(),
            "clue": clue,
            "category": category,
            "source": source,
            "games": game_flags(answer),
        }
    )


def main() -> None:
    rows: list[dict] = []
    seen: set[str] = set()

    for line in CURATED.splitlines():
        display, clue, category = line.split("|", 2)
        add_entry(rows, seen, display, clue, category, "Bhaktiras curated")

    for index, row in enumerate(rows, 1):
        row["id"] = f"word-{index:04d}"

    OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    unique_answers = len({row["answer"] for row in rows})
    by_game = {
        game: sum(1 for row in rows if game in row["games"])
        for game in ("wordle", "crossword")
    }
    print(f"Wrote {len(rows)} entries ({unique_answers} unique answers) to {OUTPUT}")
    print(f"Game coverage: {by_game}")


if __name__ == "__main__":
    main()
