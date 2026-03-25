/**
 * Конфигурация 15 миссий кампании «Вторжение» и пресеты окружения.
 * Баланс правится здесь без изменения игрового кода.
 */

/** Пресеты визуальной среды (Three.js hex, туман, плотность облаков 0..1) */
export const EnvironmentConfig = {
    DAY: {
        key: 'DAY',
        skyColor: 0x87ceeb,
        fogNear: 100,
        fogFar: 500,
        groundColor: 0x3b7d3b,
        cloudDensity: 0.85,
        hemiIntensity: 0.6,
        dirIntensity: 0.85
    },
    DENSE_CLOUD: {
        key: 'DENSE_CLOUD',
        skyColor: 0xa8c4e0,
        fogNear: 80,
        fogFar: 380,
        groundColor: 0x2d5a3d,
        cloudDensity: 0.95,
        hemiIntensity: 0.55,
        dirIntensity: 0.75,
        visibility: 0.72
    },
    NIGHT_CITY: {
        key: 'NIGHT_CITY',
        skyColor: 0x0a0a2a,
        fogNear: 60,
        fogFar: 420,
        groundColor: 0x1a2a1a,
        cloudDensity: 0.45,
        hemiIntensity: 0.35,
        dirIntensity: 0.45
    },
    STORM: {
        key: 'STORM',
        skyColor: 0x2a2a3a,
        fogNear: 50,
        fogFar: 320,
        groundColor: 0x2a4a3a,
        cloudDensity: 0.92,
        hemiIntensity: 0.4,
        dirIntensity: 0.55,
        visibility: 0.55,
        weather: 'rain'
    },
    OCEAN_DAWN: {
        key: 'OCEAN_DAWN',
        skyColor: 0xffa07a,
        fogNear: 90,
        fogFar: 480,
        groundColor: 0x3a5c6b,
        cloudDensity: 0.7,
        hemiIntensity: 0.65,
        dirIntensity: 0.8
    },
    STRATOSPHERE: {
        key: 'STRATOSPHERE',
        skyColor: 0x1a2a4a,
        fogNear: 120,
        fogFar: 550,
        groundColor: 0x2a3a55,
        cloudDensity: 0.35,
        hemiIntensity: 0.5,
        dirIntensity: 0.75
    },
    SPACE_DEBRIS: {
        key: 'SPACE_DEBRIS',
        skyColor: 0x050510,
        fogNear: 150,
        fogFar: 600,
        groundColor: 0x1a1a22,
        cloudDensity: 0.12,
        hemiIntensity: 0.25,
        dirIntensity: 0.5
    },
    AURORA: {
        key: 'AURORA',
        skyColor: 0x0a1a2a,
        fogNear: 70,
        fogFar: 450,
        groundColor: 0x1a3a2a,
        cloudDensity: 0.4,
        hemiIntensity: 0.45,
        dirIntensity: 0.55
    },
    ORBITAL: {
        key: 'ORBITAL',
        skyColor: 0x000018,
        fogNear: 100,
        fogFar: 580,
        groundColor: 0x151520,
        cloudDensity: 0.08,
        hemiIntensity: 0.2,
        dirIntensity: 0.55
    },
    MOON_SHADOW: {
        key: 'MOON_SHADOW',
        skyColor: 0x020208,
        fogNear: 40,
        fogFar: 350,
        groundColor: 0x0a0a12,
        cloudDensity: 0.15,
        hemiIntensity: 0.15,
        dirIntensity: 0.35,
        visibility: 0.48
    },
    VOID_MIST: {
        key: 'VOID_MIST',
        skyColor: 0x1a0a2a,
        fogNear: 55,
        fogFar: 360,
        groundColor: 0x2a1a3a,
        cloudDensity: 0.55,
        hemiIntensity: 0.35,
        dirIntensity: 0.45,
        visibility: 0.62,
        particles: 'purple'
    },
    ASTEROID_FIELD: {
        key: 'ASTEROID_FIELD',
        skyColor: 0x1a1a2a,
        fogNear: 80,
        fogFar: 480,
        groundColor: 0x252530,
        cloudDensity: 0.2,
        hemiIntensity: 0.3,
        dirIntensity: 0.5
    },
    FLEET_BATTLE: {
        key: 'FLEET_BATTLE',
        skyColor: 0x1a1525,
        fogNear: 70,
        fogFar: 400,
        groundColor: 0x2a2035,
        cloudDensity: 0.5,
        hemiIntensity: 0.4,
        dirIntensity: 0.55
    },
    MOTHERSHIP: {
        key: 'MOTHERSHIP',
        skyColor: 0x2a1a1a,
        fogNear: 50,
        fogFar: 380,
        groundColor: 0x3a2a2a,
        cloudDensity: 0.35,
        hemiIntensity: 0.38,
        dirIntensity: 0.5
    },
    VOID_CORE: {
        key: 'VOID_CORE',
        skyColor: 0x120818,
        fogNear: 45,
        fogFar: 340,
        groundColor: 0x1a1028,
        cloudDensity: 0.4,
        hemiIntensity: 0.32,
        dirIntensity: 0.42,
        visibility: 0.65,
        particles: 'purple'
    }
};

/**
 * @typedef {object} MissionDefinition
 * @property {number} id 1..15
 * @property {string} title
 * @property {number|null} requiresMissionId предыдущая миссия (null для первой)
 * @property {keyof typeof EnvironmentConfig} environment
 * @property {number} bossHPMultiplier множитель к базовому HP босса миссии
 * @property {number} enemySpawnMultiplier множитель частоты спавна (× к модификатору сложности)
 * @property {number} bossScoreThreshold абсолютный счёт для появления босса
 * @property {number} baseCredits базовая награда (итог: × (1 + 0.1 × звёзды))
 * @property {number} bonusCreditsPerStar доп. кредиты за звезду сверх формулы (опционально 0)
 * @property {string} briefingText текст брифинга
 * @property {string[]} enemies список врагов (для разведданных)
 * @property {string} bossName имя босса
 */

/** @type {MissionDefinition[]} */
export const MISSIONS = [
    {
        id: 1,
        title: 'Первый контакт',
        requiresMissionId: null,
        environment: 'DAY',
        bossHPMultiplier: 0.62,
        enemySpawnMultiplier: 0.58,
        bossScoreThreshold: 3600,
        baseCredits: 500,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Первые волны врага замечены над центральным регионом. Это базовые разведывательные дроны «Глаз». Они сканируют поверхность в поисках целей для вторжения.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Уничтожить разведывательную группу</li>
                <li>Ликвидировать командира сектора «Глаз»</li>
                <li>Не допустить передачи данных на орбиту</li>
            </ul>
        `,
        enemies: ['Drone (Разведчик)'],
        bossName: '«Глаз»'
    },
    {
        id: 2,
        title: 'Облачный патруль',
        requiresMissionId: 1,
        environment: 'DENSE_CLOUD',
        bossHPMultiplier: 0.68,
        enemySpawnMultiplier: 0.62,
        bossScoreThreshold: 4000,
        baseCredits: 600,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Враг адаптируется. Новые единицы замечены в плотных облачных слоях. Они используют облака для маскировки и внезапных атак.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Прочесать облачный слой</li>
                <li>Уничтожить штурмовые дроны «Клык»</li>
                <li>Обеспечить безопасность наземных объектов</li>
            </ul>
        `,
        enemies: ['Drone', 'Kamikaze'],
        bossName: '«Клык»'
    },
    {
        id: 3,
        title: 'Ночной дозор',
        requiresMissionId: 2,
        environment: 'NIGHT_CITY',
        bossHPMultiplier: 0.75,
        enemySpawnMultiplier: 0.68,
        bossScoreThreshold: 4200,
        baseCredits: 700,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Ночное небо больше не безопасно. Вражеские шутеры используют темноту для скрытного огня. Их пули трудно заметить до последнего момента.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Патрулирование ночного сектора</li>
                <li>Ликвидация снайперских дронов «Призрак»</li>
                <li>Защита гражданского воздушного пространства</li>
            </ul>
        `,
        enemies: ['Drone', 'Shooter'],
        bossName: '«Призрак»'
    },
    {
        id: 4,
        title: 'Штормовой фронт',
        requiresMissionId: 3,
        environment: 'STORM',
        bossHPMultiplier: 0.88,
        enemySpawnMultiplier: 0.78,
        bossScoreThreshold: 5200,
        baseCredits: 800,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Враг научился использовать погоду. Молнии наносят урон всем — и нам, и им. Грозовой фронт стал полем боя.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Прорыв через штормовой коридор</li>
                <li>Уничтожение погодных манипуляторов «Шквал»</li>
                <li>Предотвращение климатического оружия</li>
            </ul>
        `,
        enemies: ['Kamikaze', 'Shooter', 'Молнии'],
        bossName: '«Шквал»'
    },
    {
        id: 5,
        title: 'Прибрежная блокада',
        requiresMissionId: 4,
        environment: 'OCEAN_DAWN',
        bossHPMultiplier: 0.98,
        enemySpawnMultiplier: 0.88,
        bossScoreThreshold: 5800,
        baseCredits: 1000,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Критическая точка. Враг закрепился над океаном, блокируя морские пути. Флагман «Левиафан» координирует все операции в регионе.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Прорыв морской блокады</li>
                <li>Уничтожение флагмана сектора «Левиафан»</li>
                <li>Открытие пути к стратосфере</li>
            </ul>
        `,
        enemies: ['Все типы'],
        bossName: '«Левиафан»'
    },
    {
        id: 6,
        title: 'Стратосфера',
        requiresMissionId: 5,
        environment: 'STRATOSPHERE',
        bossHPMultiplier: 1.05,
        enemySpawnMultiplier: 0.92,
        bossScoreThreshold: 6200,
        baseCredits: 1200,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Мы выходим за пределы стандартной зоны ПВО. Воздух разрежен, скорость полёта выше. Враг развернул элитные перехватчики.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Перехват элитных дронов</li>
                <li>Ликвидация перехватчика «Сокол»</li>
                <li>Сбор данных о высоте вторжения</li>
            </ul>
        `,
        enemies: ['Elite Drone', 'Elite Shooter'],
        bossName: '«Сокол»'
    },
    {
        id: 7,
        title: 'Кладбище спутников',
        requiresMissionId: 6,
        environment: 'SPACE_DEBRIS',
        bossHPMultiplier: 1.12,
        enemySpawnMultiplier: 0.98,
        bossScoreThreshold: 6800,
        baseCredits: 1400,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Орбита заполнена обломками старых спутников. Враг использует их как прикрытие и оружие. Столкновение с обломком фатально.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Навигация через поле обломков</li>
                <li>Уничтожение сборщика «Хлам»</li>
                <li>Очистка орбитального пути</li>
            </ul>
        `,
        enemies: ['Kamikaze', 'Обломки'],
        bossName: '«Хлам»'
    },
    {
        id: 8,
        title: 'Северное сияние',
        requiresMissionId: 7,
        environment: 'AURORA',
        bossHPMultiplier: 1.2,
        enemySpawnMultiplier: 1.05,
        bossScoreThreshold: 7200,
        baseCredits: 1600,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Полярный сектор. Электромагнитные помехи от сияния искажают сенсоры. Враг маскирует свои сигналы под естественные вспышки.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Работа в условиях помех</li>
                <li>Разоблачение иллюзиониста «Мираж»</li>
                <li>Восстановление связи с полярными станциями</li>
            </ul>
        `,
        enemies: ['Shooter', 'Drone (маскировка)'],
        bossName: '«Мираж»'
    },
    {
        id: 9,
        title: 'Орбитальная платформа',
        requiresMissionId: 8,
        environment: 'ORBITAL',
        bossHPMultiplier: 1.35,
        enemySpawnMultiplier: 1.12,
        bossScoreThreshold: 7800,
        baseCredits: 1800,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Враг захватил старую орбитальную станцию. Статичные турели создают плотный огневой заслон. Манёвр почти невозможен.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Прорыв турельного кольца</li>
                <li>Штурм платформы «Цитадель»</li>
                <li>Возврат контроля над орбитой</li>
            </ul>
        `,
        enemies: ['Turret (турель)'],
        bossName: '«Цитадель»'
    },
    {
        id: 10,
        title: 'Тень луны',
        requiresMissionId: 9,
        environment: 'MOON_SHADOW',
        bossHPMultiplier: 1.48,
        enemySpawnMultiplier: 1.18,
        bossScoreThreshold: 8400,
        baseCredits: 2000,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Сектор в тени Луны. Видимость нулевая. Вражеские камикадзе невидимы до момента атаки. Командир флота «Войд» лично координирует операцию.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Бой в полной темноте</li>
                <li>Ликвидация командира «Войд»</li>
                <li>Завершение Акта 2 — выход к источнику</li>
            </ul>
        `,
        enemies: ['Elite Kamikaze'],
        bossName: '«Войд»'
    },
    {
        id: 11,
        title: 'Врата пустоты',
        requiresMissionId: 10,
        environment: 'VOID_MIST',
        bossHPMultiplier: 1.62,
        enemySpawnMultiplier: 1.22,
        bossScoreThreshold: 9200,
        baseCredits: 2500,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Мы пересекли границу. Это уже не земное пространство. Геометрия искажена. Враги регенерируют, если не уничтожать их быстро.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Вход на территорию Легиона</li>
                <li>Уничтожение хранителя «Аргус»</li>
                <li>Поддержание комбо для блокировки регенерации</li>
            </ul>
        `,
        enemies: ['Все элитные враги'],
        bossName: '«Аргус»'
    },
    {
        id: 12,
        title: 'Астероидный пояс',
        requiresMissionId: 11,
        environment: 'ASTEROID_FIELD',
        bossHPMultiplier: 1.78,
        enemySpawnMultiplier: 1.28,
        bossScoreThreshold: 9800,
        baseCredits: 3000,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Астероидный пояс вокруг базы врага. Камни летят со всех сторон. Бурильщик «Крот» разрушает астероиды, создавая дополнительные угрозы.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Навигация в хаотичном поле</li>
                <li>Ликвидация бурильщика «Крот»</li>
                <li>Приближение к материнскому кораблю</li>
            </ul>
        `,
        enemies: ['Shooter', 'Астероиды'],
        bossName: '«Крот»'
    },
    {
        id: 13,
        title: 'Перехват флота',
        requiresMissionId: 12,
        environment: 'FLEET_BATTLE',
        bossHPMultiplier: 1.92,
        enemySpawnMultiplier: 1.32,
        bossScoreThreshold: 10500,
        baseCredits: 3500,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Весь флот Легиона собран здесь. Волны врагов бесконечны. Адмирал «Легион» управляет ими в реальном времени. Время на исходе.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Прорыв через флот</li>
                <li>Убийство адмирала до подкрепления</li>
                <li>Ограниченное время на босса</li>
            </ul>
        `,
        enemies: ['Drone', 'Shooter (x2)'],
        bossName: '«Легион»'
    },
    {
        id: 14,
        title: 'Подход к материнскому',
        requiresMissionId: 13,
        environment: 'MOTHERSHIP',
        bossHPMultiplier: 2.05,
        enemySpawnMultiplier: 1.36,
        bossScoreThreshold: 11200,
        baseCredits: 4000,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>Материнский корабль на виду. Но он защищён энергетическим щитом. Нужно уничтожить генераторы щита перед атакой на цель.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Уничтожение генераторов щита</li>
                <li>Прорыв защиты «Барьер»</li>
                <li>Подготовка к финальному штурму</li>
            </ul>
        `,
        enemies: ['Elite All', 'Ракеты'],
        bossName: '«Барьер»'
    },
    {
        id: 15,
        title: 'Ядро вторжения',
        requiresMissionId: 14,
        environment: 'VOID_CORE',
        bossHPMultiplier: 2.2,
        enemySpawnMultiplier: 1.42,
        bossScoreThreshold: 12000,
        baseCredits: 5000,
        bonusCreditsPerStar: 0,
        briefingText: `
            <p><strong>📡 РАЗВЕДДАННЫЕ:</strong></p>
            <p>ТЫ ВНУТРИ. Это сердце вторжения. Органическая структура корабля. Прах Пустоты «Зеро» — источник всей угрозы. Три фазы боя. Нет права на ошибку.</p>
            <p><strong>🎯 ЦЕЛИ ОПЕРАЦИИ:</strong></p>
            <ul>
                <li>Уничтожение источника вторжения</li>
                <li>Ликвидация «Зеро» (3 фазы)</li>
                <li>ЗАВЕРШЕНИЕ КАМПАНИИ</li>
            </ul>
        `,
        enemies: ['Бесконечные волны'],
        bossName: '«Зеро»'
    }
];

const MISSION_BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));

/**
 * @param {number} missionId
 * @returns {MissionDefinition|undefined}
 */
export function getMissionById(missionId) {
    return MISSION_BY_ID.get(missionId);
}

/**
 * Кредиты за миссию по дизайну: Base × (1 + 0.1 × stars) + бонус за звезду из конфига.
 * @param {MissionDefinition} mission
 * @param {number} stars 1..3
 */
export function calculateMissionCredits(mission, stars) {
    const s = Math.min(3, Math.max(1, stars | 0));
    const base = Math.floor(mission.baseCredits * (1 + 0.1 * s));
    return base + (mission.bonusCreditsPerStar || 0) * s;
}

/**
 * Звёзды: прохождение = 1; комбо = +1; без урона в бою с боссом = условие 3-й звезды при хорошем комбо.
 * @param {{ playerNoDamage: boolean, maxCombo: number }} run
 */
export function computeMissionStars(run) {
    const maxCombo = Math.floor(Number(run.maxCombo) || 1);
    let stars = 1;
    if (maxCombo >= 4) stars = 2;
    if (run.playerNoDamage && maxCombo >= 5) stars = 3;
    else if (run.playerNoDamage && maxCombo >= 4) stars = Math.max(stars, 2);
    return Math.min(3, stars);
}
