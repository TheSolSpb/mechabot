const Discord = require('discord.js');
const client = new Discord.Client();
const Prefix = 'м!';
const Sequelize = require('sequelize');
const pg = require('pg');

// Initializing the database
const sequelize = new Sequelize(process.env.DATABASE_URL, 
{
	host: 'localhost',
	logging: false,
	dialect:'postgres'
});

// Creating an item model
const Items = sequelize.define('items',
	{
		UID: Sequelize.BIGINT,
		name: Sequelize.STRING,
		type: Sequelize.INTEGER,
		place: Sequelize.INTEGER,
		price: Sequelize.FLOAT,
		arg1: Sequelize.INTEGER,
		arg2: Sequelize.INTEGER,
		arg3: Sequelize.INTEGER
	},
);

// Creating a Unit bank model
const Bank = sequelize.define('balances',
	{
		UID: Sequelize.BIGINT,
		units: Sequelize.INTEGER
	},
);

// Bot launch sequence
client.once('ready', () => {
	Items.sync();
	Bank.sync();

	console.log('Ready!');
});

// !!! Process the message with prefix subtracted !!!
function ProcessMessage(receivedMessage, messageContent)
{
	// Give help
	if (messageContent == 'помощь')
	{
		var str = '';
		str += '**м!мехпомощь** - показать инструкцию по строительству меха\n';
		str += '**м!битвапомощь** - показать инструкцию по сражениям\n';
		str += '**м!битва** - отправить меха в сражение\n';
		str += '**м!инв** - показать баланс и инвентарь\n';
		str += '**м!мех** - показать комплектацию меха\n';
		str += '**м!уст** ***x*** ***y*** - установить *x*-й предмет в слот меха *y*: м!уст 3 пр\n';
		str += '**м!ул** ***x*** - улучшить *x*-й предмет в инвентаре: м!ул 4\n';
		str += '**м!прод** ***x*** - продать *x*-й из инвентаря за полцены: м!прод 5\n';	
		str += '**м!проднеуст** - продать все неустановленные на мехе предметы за полцены\n';	
		str += '**м!куп** ***x*** - купить случайный предмет за утроенную цену (не менее 30Ю): м!куп 90\n';	

		receivedMessage.channel.send(str);
	}
	// Give help on building mechs
	else if (messageContent == 'мехпомощь')
	{
		var str = ':white_small_square:Ваш мех состоит из семи частей:\n';
		str += ':white_small_square:Центральный торс (ЦТ), Левый/Правый Торс (ЛТ/ПТ), Левая/Правая Рука (ЛР/ПР), Левая/Правая Нога (ЛН/ПН).\n';
		str += ":white_small_square:Ядро можно установить только в ЦТ. Оно определяет вместимость меха по энергии и массе, а также Базовую Скорость.\n";
		str += ':white_small_square:Оружие можно устанавливать в боковые Торсы и Руки, броню - в боковые Торсы и Ноги.\n';
		str += ':white_small_square:Характеристика оружия - Урон в Минуту, равный произведению Урона на Выстрелы в Минуту.\n';
		str += ":white_small_square:Броня обеспечивает Переднюю и Заднюю Защиты. Чем мех легче, тем он быстрее.\n";
		str += ":white_small_square:Отношение Скоростей вашего и вражеского мехов определяет преимущество.\n";
		str += ":white_small_square:Оно позволяет частично наносить урон Задней Защите, обычно более слабой.\n";

		receivedMessage.channel.send(str);
	}
	// Give help on combat
	else if (messageContent == 'битвапомощь')
	{
		var str = ':white_small_square:Вы можете отправить своего меха сразиться с вражеским:\n';
		str += ":white_small_square:Перед сражением вы увидите сравнение характеристик мехов.\n";
		str += ":white_small_square:В зависимости от Скоростей, вы или противник получите преимущество.\n";
		str += ":white_small_square:Обладатель преимущества будет наносить процент своего Урона по Задней Защите противника, равный проценту преимущества.\n";
		str += ":white_small_square:За счёт, впрочем, Урона по Передней Защите.\n";
		str += ':white_small_square:Рассчитывается время уничтожения мехов через Переднюю и Заднюю защиты.\n';
		str += ":white_small_square:Если ваш мех уничтожается быстрее, вам засчитывается поражение.\n";
		str += ":white_small_square:Если быстрее уничтожается вражеский мех, то вы - победитель в сражении.\n";
		str += ":white_small_square:За каждую победу вы получаете новую деталь со стоимостью, равной стоимости деталей вражеского меха.\n";
		str += ":white_small_square:Оснащайте свой мех новыми деталями или продавайте их, чтобы улучшить старые!\n";

		receivedMessage.channel.send(str);
	}
	// Give an item
	/*else if (messageContent == 'add')
	{
		AddItem(receivedMessage, 10);
	}*/
	// Give 10 items
	/*else if (messageContent == 'massadd')
	{
		AddItem(receivedMessage, 10); AddItem(receivedMessage, 10);
		AddItem(receivedMessage, 10); AddItem(receivedMessage, 10);
		AddItem(receivedMessage, 10); AddItem(receivedMessage, 10);
		AddItem(receivedMessage, 10); AddItem(receivedMessage, 10);
		AddItem(receivedMessage, 10); AddItem(receivedMessage, 10);
	}*/
	// Check inventory
	else if (messageContent == 'инв')
	{
		ShowInventory(receivedMessage);
	}
	// Check mech
	else if (messageContent == 'мех')
	{
		ShowMech(receivedMessage);
	}
	// Upgrade an item
	else if (messageContent.startsWith('ул '))
	{
		var index = messageContent.substr(3);
		UpgradeItem(receivedMessage, index - 1);
	}
	// Sell an item for 1/2x funds
	else if (messageContent.startsWith('прод '))
	{
		var index = messageContent.substr(5);
		SellItem(receivedMessage, index - 1);
	}
	// Buy an item for 3x funds
	else if (messageContent.startsWith('куп '))
	{
		BuyItem(receivedMessage);
	}
	// Sell unused items
	else if (messageContent == 'проднеуст')
	{
		SellNotInstalled(receivedMessage);
	}
	// Install an item
	else if (messageContent.startsWith('уст '))
	{
		var data = messageContent.substr(4);
		PutItem(receivedMessage, data);
	}
	// Encounter
	else if (messageContent == 'битва')
	{
		Encounter(receivedMessage);
	}
	// PvP
	else if (messageContent.startsWith('пвп '))
	{
		pvp(receivedMessage);
	}

	//
	else
	{
		receivedMessage.channel.send('Команда не распознана!');
	}
}

// PvP
async function pvp(receivedMessage)
{
	var mention = receivedMessage.content.substr(6);
	if (!mention) return;
	if (mention.startsWith('<@') && mention.endsWith('>'))
	{
		mention = mention.slice(2, -1);

		if (mention.startsWith('!'))
		{
			mention = mention.slice(1);
		}
	}

	var rivalID = mention;
	var rivalGuildMember = await receivedMessage.guild.members.fetch(rivalID);
	var rivalUser = rivalGuildMember.user;

	if (rivalUser == null)
	{
		receivedMessage.channel.send("There isn't such a player on this server!")
		return;
	}

	// Player stats
	var plFrontArmor = await GetMechFrontArmor(receivedMessage);
	var plBackArmor = await GetMechBackArmor(receivedMessage);
	var plWeaponDPM = WeaponDPM(await GetMechArg(receivedMessage, 4, 1), await GetMechArg(receivedMessage, 4, 2))
	 + WeaponDPM(await GetMechArg(receivedMessage, 5, 1), await GetMechArg(receivedMessage, 5, 2))
	  + (await GetMechArg(receivedMessage, 2, 0) == 0 ? WeaponDPM(await GetMechArg(receivedMessage, 2, 1), await GetMechArg(receivedMessage, 2, 2)) : 0)
	   + (await GetMechArg(receivedMessage, 3, 0) == 0 ? WeaponDPM(await GetMechArg(receivedMessage, 3, 1), await GetMechArg(receivedMessage, 3, 2)) : 0);

	var plSpeed = await GetMechSpeed(receivedMessage);

	// Rival stats
	var encFrontArmor = await GetMechFrontArmorID(rivalID);
	var encBackArmor = await GetMechBackArmorID(rivalID);
	var encWeaponDPM = WeaponDPM(await GetMechArgID(rivalID, 4, 1), await GetMechArgID(rivalID, 4, 2))
	 + WeaponDPM(await GetMechArgID(rivalID, 5, 1), await GetMechArgID(rivalID, 5, 2))
	  + (await GetMechArgID(rivalID, 2, 0) == 0 ? WeaponDPM(await GetMechArgID(rivalID, 2, 1), await GetMechArgID(rivalID, 2, 2)) : 0)
	   + (await GetMechArgID(rivalID, 3, 0) == 0 ? WeaponDPM(await GetMechArgID(rivalID, 3, 1), await GetMechArgID(rivalID, 3, 2)) : 0);

	var encSpeed = await GetMechSpeedID(rivalID);

	// Listing the stats
	var statStr = 'Сражение с мехом игрока ' + rivalUser.username +':\n';
	statStr += 'Передняя Защита: ' + plFrontArmor + ' против ' + encFrontArmor + '\n';
	statStr += 'Задняя Защита: ' + plBackArmor + ' против ' + encBackArmor + '\n';
	statStr += 'УВМ: ' + plWeaponDPM + ' против ' + encWeaponDPM + '\n';
	statStr += 'Скорость: ' + plSpeed + ' против ' + encSpeed + '\n';
	receivedMessage.channel.send(statStr);

	// Calculating advantage
	var playerAdvantage = false;
	var advantage = 0;

	if (plSpeed > encSpeed)
	{
		playerAdvantage = true;
		advantage = (plSpeed - encSpeed) / plSpeed;
		receivedMessage.channel.send('У вас ' + Math.ceil(advantage * 100) + '%-ное преимущество!');
	}
	else if (encSpeed > plSpeed)
	{
		playerAdvantage = false;
		advantage = (encSpeed - plSpeed) / encSpeed;
		receivedMessage.channel.send('У противника ' + Math.ceil(advantage * 100) + '%-ное преимущество!');
	}
	else
	{
		playerAdvantage = false;
		advantage = 0;
		receivedMessage.channel.send('Скорости равны, ни у кого нет преимущества!');
	}

	// Calculating TTKs
	var encDPMtoF = (playerAdvantage ? encWeaponDPM : Math.round(encWeaponDPM * (1 - advantage)));
	var encDPMtoB = (playerAdvantage ? 0 : Math.round(encWeaponDPM * advantage));

	var plDPMtoF = (!playerAdvantage ? plWeaponDPM : Math.round(plWeaponDPM * (1 - advantage)));
	var plDPMtoB = (!playerAdvantage ? 0 : Math.round(plWeaponDPM * advantage));

	//receivedMessage.channel.send("Player will be dealing " + plDPMtoF + " DPM to front armor and " + plDPMtoB + " DPM to back armor\nEnemy will be dealing " + encDPMtoF + " DPM to front armor and " + encDPMtoB + " DPM to back armor");

	var TTKencToF = encFrontArmor / plDPMtoF;
	var TTKencToB = encBackArmor / plDPMtoB;

	var TTKplToF = plFrontArmor / encDPMtoF;
	var TTKplToB = plBackArmor / encDPMtoB;

	//receivedMessage.channel.send("Player would be killed in " + TTKplToF.toPrecision(2) + "F or " + TTKplToB.toPrecision(2) + "B, enemy would be killed in " + TTKencToF.toPrecision(2) + "F or " + TTKencToB.toPrecision(2) + "B");

	var TTKencFastest = (TTKencToF > TTKencToB ? TTKencToB : TTKencToF);
	var TTKplFastest = (TTKplToF > TTKplToB ? TTKplToB : TTKplToF);

	var playerIsKilled = (TTKplFastest <= TTKencFastest? true : false);

	if (playerIsKilled)
	{
		receivedMessage.channel.send("**ПОРАЖЕНИЕ!** Мех игрока " + receivedMessage.author.username + " был уничтожен за " + TTKplFastest.toPrecision(2) + " минут, за " + (TTKencFastest - TTKplFastest).toPrecision(2) + " минут до того, как он бы уничтожил мех игрока " + rivalUser.username + "!");
	}
	else
	{
		receivedMessage.channel.send("**ПОБЕДА!** Мех игрока " + rivalUser.username + " был уничтожен за " + TTKencFastest.toPrecision(2) + " минут, за " + (TTKplFastest - TTKencFastest).toPrecision(2) + " минут до того, как он бы победил мех игрока " + receivedMessage.author.username + "!");
	}
}

// Generate an encounter
async function Encounter(receivedMessage)
{
	// Encounter mech
	var RNG = 0.3 + (Math.random() * 2.7);
	var enemyPrice = await GetMechPrice(receivedMessage);
	enemyPrice *= RNG;
	enemyPrice = Math.round(enemyPrice); // Getting the whole mech price
	enemyPrice /= 7;
	enemyPrice = Math.floor(enemyPrice); // Getting a part price
	
	// CT
	var ctType = 2;
	var ctWhich = RandCore();
	var ctHasPeculiarity = (Math.random() * 3) > 2;
	var ctPeculiarity = 0;
	if (ctHasPeculiarity)
	{
		ctPeculiarity = RandCorePeculiarity();
	}
	var ctArg1 = GeneratePart(2, 1, enemyPrice, ctWhich, ctHasPeculiarity, ctPeculiarity);
	var ctArg2 = GeneratePart(2, 2, enemyPrice, ctWhich, ctHasPeculiarity, ctPeculiarity);
	var ctArg3 = GeneratePart(2, 3, enemyPrice, ctWhich, ctHasPeculiarity, ctPeculiarity);
	
	// LT
	var ltType = Math.floor(Math.random() * 2);
	var ltWhich = 0;
	if (ltType == 0) ltWhich = RandWeapon();
	else ltWhich = RandArmor();
	var ltHasPeculiarity = (Math.random() * 3) > 2;
	var ltPeculiarity = 0;
	if (ltHasPeculiarity)
	{
		if (ltType == 0) ltPeculiarity = RandWeaponPeculiarity();
		else ltPeculiarity = RandArmorPeculiarity();
	}
	var ltArg1 = GeneratePart(ltType, 1, enemyPrice, ltWhich, ltHasPeculiarity, ltPeculiarity);
	var ltArg2 = GeneratePart(ltType, 2, enemyPrice, ltWhich, ltHasPeculiarity, ltPeculiarity);
	var ltArg3 = GeneratePart(ltType, 3, enemyPrice, ltWhich, ltHasPeculiarity, ltPeculiarity);

	// RT
	var rtType = Math.floor(Math.random() * 2);
	var rtWhich = 0;
	if (rtType == 0) rtWhich = RandWeapon();
	else rtWhich = RandArmor();
	var rtHasPeculiarity = (Math.random() * 3) > 2;
	var rtPeculiarity = 0;
	if (rtHasPeculiarity)
	{
		if (rtType == 0) rtPeculiarity = RandWeaponPeculiarity();
		else rtPeculiarity = RandArmorPeculiarity();
	}
	var rtArg1 = GeneratePart(rtType, 1, enemyPrice, rtWhich, rtHasPeculiarity, rtPeculiarity);
	var rtArg2 = GeneratePart(rtType, 2, enemyPrice, rtWhich, rtHasPeculiarity, rtPeculiarity);
	var rtArg3 = GeneratePart(rtType, 3, enemyPrice, rtWhich, rtHasPeculiarity, rtPeculiarity);

	// LA
	var laType = 0;
	var laWhich = RandWeapon();
	var laHasPeculiarity = (Math.random() * 3) > 2;
	var laPeculiarity = 0;
	if (laHasPeculiarity)
	{
		laPeculiarity = RandWeaponPeculiarity();
	}
	var laArg1 = GeneratePart(0, 1, enemyPrice, laWhich, laHasPeculiarity, laPeculiarity);
	var laArg2 = GeneratePart(0, 2, enemyPrice, laWhich, laHasPeculiarity, laPeculiarity);
	var laArg3 = GeneratePart(0, 3, enemyPrice, laWhich, laHasPeculiarity, laPeculiarity);

	// RA
	var raType = 0;
	var raWhich = RandWeapon();
	var raHasPeculiarity = (Math.random() * 3) > 2;
	var raPeculiarity = 0;
	if (raHasPeculiarity)
	{
		raPeculiarity = RandWeaponPeculiarity();
	}
	var raArg1 = GeneratePart(0, 1, enemyPrice, raWhich, raHasPeculiarity, raPeculiarity);
	var raArg2 = GeneratePart(0, 2, enemyPrice, raWhich, raHasPeculiarity, raPeculiarity);
	var raArg3 = GeneratePart(0, 3, enemyPrice, raWhich, raHasPeculiarity, raPeculiarity);

	// LL
	var llType = 1;
	var llWhich = RandArmor();
	var llHasPeculiarity = (Math.random() * 3) > 2;
	var llPeculiarity = 0;
	if (llHasPeculiarity)
	{
		llPeculiarity = RandArmorPeculiarity();
	}
	var llArg1 = GeneratePart(1, 1, enemyPrice, llWhich, llHasPeculiarity, llPeculiarity);
	var llArg2 = GeneratePart(1, 2, enemyPrice, llWhich, llHasPeculiarity, llPeculiarity);
	var llArg3 = GeneratePart(1, 3, enemyPrice, llWhich, llHasPeculiarity, llPeculiarity);

	// RL
	var rlType = 1;
	var rlWhich = RandArmor();
	var rlHasPeculiarity = (Math.random() * 3) > 2;
	var rlPeculiarity = 0;
	if (rlHasPeculiarity)
	{
		rlPeculiarity = RandArmorPeculiarity();
	}
	var rlArg1 = GeneratePart(1, 1, enemyPrice, rlWhich, rlHasPeculiarity, rlPeculiarity);
	var rlArg2 = GeneratePart(1, 2, enemyPrice, rlWhich, rlHasPeculiarity, rlPeculiarity);
	var rlArg3 = GeneratePart(1, 3, enemyPrice, rlWhich, rlHasPeculiarity, rlPeculiarity);

	/*
	ListEncounter(receivedMessage,
		[
			ctType, ctWhich, ctHasPeculiarity, ctPeculiarity, ctArg1, ctArg2, ctArg3,
			ltType, ltWhich, ltHasPeculiarity, ltPeculiarity, ltArg1, ltArg2, ltArg3,
			rtType, rtWhich, rtHasPeculiarity, rtPeculiarity, rtArg1, rtArg2, rtArg3,
			laType, laWhich, laHasPeculiarity, laPeculiarity, laArg1, laArg2, laArg3,
			raType, raWhich, raHasPeculiarity, raPeculiarity, raArg1, raArg2, raArg3,
			llType, llWhich, llHasPeculiarity, llPeculiarity, llArg1, llArg2, llArg3,
			rlType, rlWhich, rlHasPeculiarity, rlPeculiarity, rlArg1, rlArg2, rlArg3,
		]
		);
	*/

	// Encounter stats
	var encFrontArmor = llArg1 + rlArg1 + (ltType == 1 ? ltArg1 : 0) + (rtType == 1 ? rtArg1 : 0);
	var encBackArmor = llArg2 + rlArg2 + (ltType == 1 ? ltArg2 : 0) + (rtType == 1 ? rtArg2 : 0);
	var encWeaponDPM = WeaponDPM(laArg1, laArg2) + WeaponDPM(raArg1, raArg2) + (ltType == 0 ? WeaponDPM(ltArg1, ltArg2) : 0) + (rtType == 0 ? WeaponDPM(rtArg1, rtArg2) : 0);
	
	var encWeightLimit = ctArg2;
	var encBaseSpeed = ctArg3;
	var encWeight = llArg3 + rlArg3 + (ltType == 1 ? ltArg3 : 0) + (rtType == 1 ? rtArg3 : 0);
	if (encWeight > encWeightLimit) encWeight = encWeightLimit;
	var encSpeed = Math.floor(encBaseSpeed * (2 - (encWeight / encWeightLimit)));

	if (encFrontArmor == null || encFrontArmor == NaN) encFrontArmor = 1;
	if (encBackArmor == null || encBackArmor == NaN) encBackArmor = 1;
	if (encWeaponDPM == null || encWeaponDPM == NaN) encWeaponDPM = 1;
	if (encSpeed == null || encSpeed == NaN) encSpeed = 1;

	// Player stats
	var plFrontArmor = await GetMechFrontArmor(receivedMessage);
	var plBackArmor = await GetMechBackArmor(receivedMessage);
	var plWeaponDPM = WeaponDPM(await GetMechArg(receivedMessage, 4, 1), await GetMechArg(receivedMessage, 4, 2))
	 + WeaponDPM(await GetMechArg(receivedMessage, 5, 1), await GetMechArg(receivedMessage, 5, 2))
	  + (await GetMechArg(receivedMessage, 2, 0) == 0 ? WeaponDPM(await GetMechArg(receivedMessage, 2, 1), await GetMechArg(receivedMessage, 2, 2)) : 0)
	   + (await GetMechArg(receivedMessage, 3, 0) == 0 ? WeaponDPM(await GetMechArg(receivedMessage, 3, 1), await GetMechArg(receivedMessage, 3, 2)) : 0);

	var plSpeed = await GetMechSpeed(receivedMessage);

	// Listing the stats
	var statStr = 'Сражение с вражеским мехом:\n';
	statStr += 'Передняя Защита: ' + plFrontArmor + ' против ' + encFrontArmor + '\n';
	statStr += 'Задняя Защита: ' + plBackArmor + ' против ' + encBackArmor + '\n';
	statStr += 'УВМ: ' + plWeaponDPM + ' против ' + encWeaponDPM + '\n';
	statStr += 'Скорость: ' + plSpeed + ' против ' + encSpeed + '\n';
	receivedMessage.channel.send(statStr);

	// Calculating advantage
	var playerAdvantage = false;
	var advantage = 0;

	if (plSpeed > encSpeed)
	{
		playerAdvantage = true;
		advantage = (plSpeed - encSpeed) / plSpeed;
		receivedMessage.channel.send('У вас ' + Math.ceil(advantage * 100) + '%-ное преимущество!');
	}
	else if (encSpeed > plSpeed)
	{
		playerAdvantage = false;
		advantage = (encSpeed - plSpeed) / encSpeed;
		receivedMessage.channel.send('У противника ' + Math.ceil(advantage * 100) + '%-ное преимущество!');
	}
	else
	{
		playerAdvantage = false;
		advantage = 0;
		receivedMessage.channel.send('Скорости равны, ни у кого нет преимущества!');
	}

	// Calculating TTKs
	var encDPMtoF = (playerAdvantage ? encWeaponDPM : Math.round(encWeaponDPM * (1 - advantage)));
	var encDPMtoB = (playerAdvantage ? 0 : Math.round(encWeaponDPM * advantage));

	var plDPMtoF = (!playerAdvantage ? plWeaponDPM : Math.round(plWeaponDPM * (1 - advantage)));
	var plDPMtoB = (!playerAdvantage ? 0 : Math.round(plWeaponDPM * advantage));

	//receivedMessage.channel.send("Player will be dealing " + plDPMtoF + " DPM to front armor and " + plDPMtoB + " DPM to back armor\nEnemy will be dealing " + encDPMtoF + " DPM to front armor and " + encDPMtoB + " DPM to back armor");

	var TTKencToF = encFrontArmor / plDPMtoF;
	var TTKencToB = encBackArmor / plDPMtoB;

	var TTKplToF = plFrontArmor / encDPMtoF;
	var TTKplToB = plBackArmor / encDPMtoB;

	//receivedMessage.channel.send("Player would be killed in " + TTKplToF.toPrecision(2) + "F or " + TTKplToB.toPrecision(2) + "B, enemy would be killed in " + TTKencToF.toPrecision(2) + "F or " + TTKencToB.toPrecision(2) + "B");

	var TTKencFastest = (TTKencToF > TTKencToB ? TTKencToB : TTKencToF);
	var TTKplFastest = (TTKplToF > TTKplToB ? TTKplToB : TTKplToF);

	var playerIsKilled = (TTKplFastest <= TTKencFastest? true : false);

	if (playerIsKilled)
	{
		receivedMessage.channel.send("**ПОРАЖЕНИЕ!** Ваш мех был уничтожен за " + TTKplFastest.toPrecision(2) + " минут, за " + (TTKencFastest - TTKplFastest).toPrecision(2) + " минут до того, как вы бы победили вражеский!");
	}
	else
	{
		receivedMessage.channel.send("**ПОБЕДА!** Вражеский мех был уничтожен за " + TTKencFastest.toPrecision(2) + " минут, за " + (TTKplFastest - TTKencFastest).toPrecision(2) + " минут до того, как он бы победил ваш!");
		var item = await AddItem(receivedMessage, enemyPrice);
		const AllItems = await Items.findAll({ where: { UID: receivedMessage.author.id } });
		var itemsCount = AllItems.length;
		receivedMessage.channel.send(receivedMessage.author.username + " получил: [" + itemsCount + '] ' + await GetItemString(receivedMessage, item, false, false, true));
	}
}

// List the encounter mech
function ListEncounter(receivedMessage, args)
{
	// args are
	// 0ct - 1lt - 2rt - 3la - 4ra - 5ll - 6rl
	// for each part: 0type - 1which - 2haspecul - 3pecul - 4arg1 - 5arg2 - 6arg3
	/* 
		tt wh hp pc a1 a2 a3
		00 01 02 03 04 05 06 ct
		07 08 09 10 11 12 13 lt
		14 15 16 17 18 19 20 rt
		21 22 23 24 25 26 27 la
		28 29 30 31 32 33 34 ra
		35 36 37 38 39 40 41 ll
		42 43 44 45 46 47 48 rl
	*/
	// I hate my life
	var str = '';
	str += 'Encountered an enemy mech:\n';
	str += 'CT > ' + (args[2] ? GetCorePecul(args[3]) : '') + ' ' + GetCoreName(args[1]) + ' ' + args[4] + ' ' + args[5] + ' ' + args[6] + '\n';
	str += 'LT > ' + (args[9] ? (args[7] == 0 ? GetWeaponPecul(args[10]) : GetArmorPecul(args[10])) : '') + ' ' + (args[7] == 0 ? GetWeaponName(args[8]) : GetArmorName(args[8])) + ' ' + args[11] + ' ' + args[12] + ' ' + args[13] + '\n';
	str += 'RT > ' + (args[16] ? (args[14] == 0 ? GetWeaponPecul(args[17]) : GetArmorPecul(args[17])) : '') + ' ' + (args[14] == 0 ? GetWeaponName(args[15]) : GetArmorName(args[15])) + ' ' + args[18] + ' ' + args[19] + ' ' + args[20] + '\n';
	str += 'LA > ' + (args[23] ? GetWeaponPecul(args[24]) : '') + ' ' + GetWeaponName(args[22]) + ' ' + args[25] + ' ' + args[26] + ' ' + args[27] + '\n';
	str += 'RA > ' + (args[30] ? GetWeaponPecul(args[31]) : '') + ' ' + GetWeaponName(args[29]) + ' ' + args[32] + ' ' + args[33] + ' ' + args[34] + '\n';
	str += 'LL > ' + (args[37] ? GetArmorPecul(args[38]) : '') + ' ' + GetArmorName(args[36]) + ' ' + args[39] + ' ' + args[40] + ' ' + args[41] + '\n';
	str += 'RL > ' + (args[44] ? GetArmorPecul(args[45]) : '') + ' ' + GetArmorName(args[43]) + ' ' + args[46] + ' ' + args[47] + ' ' + args[48] + '\n';
	receivedMessage.channel.send(str);
}

// Generate a part for the encounter mech
function GeneratePart(type, arg, price, which, haspecul, pecul)
{
	var res = 0;

	if (type == 0)
	{
		if (arg == 1) res = ApplyModifiers(price, GetDataArray("wdmg")[which], GetDataArray("wpeculdmg")[pecul], haspecul);
		if (arg == 2) res = ApplyModifiers(price, GetDataArray("wrof")[which], GetDataArray("wpeculrof")[pecul], haspecul);
		if (arg == 3) res = ApplyModifiers(price, GetDataArray("wen")[which], GetDataArray("wpeculen")[pecul], haspecul);
	}
	if (type == 1)
	{
		if (arg == 1) res = ApplyModifiers(price, GetDataArray("afr")[which], GetDataArray("apeculfr")[pecul], haspecul);
		if (arg == 2) res = ApplyModifiers(price, GetDataArray("abk")[which], GetDataArray("apeculbk")[pecul], haspecul);
		if (arg == 3) res = ApplyModifiers(price, GetDataArray("awt")[which], GetDataArray("apeculwt")[pecul], haspecul);
	}
	if (type == 2)
	{
		if (arg == 1) res = ApplyModifiers(price, GetDataArray("cen")[which], GetDataArray("cpeculen")[pecul], haspecul);
		if (arg == 2) res = ApplyModifiers(price, GetDataArray("cwt")[which], GetDataArray("cpeculwt")[pecul], haspecul);
		if (arg == 3) res = ApplyModifiers(price, GetDataArray("cman")[which], GetDataArray("cpeculman")[pecul], haspecul);
	}

	if (res == NaN) return 1;
	if (res == null) return 1;

	return res;
}

// Give user an item
async function AddItem(receivedMessage, Price)
{
	// Init the arguments
	var Arg1 = Price;
	var Arg2 = Price;
	var Arg3 = Price;

	// What is this
	var Type = RandItemType();

	// Setting up what this item is
	var Name = '';
	if (Type == 0)
	{
		// What weapon is this
		var Weapon = RandWeapon(); //console.log(GetWeaponName(Weapon));
		var HasPeculiarity = (Math.random() * 3) > 2;
		var Peculiarity = 0;
		if (HasPeculiarity)
		{
			Peculiarity = RandWeaponPeculiarity();
			Name += GetWeaponPecul(Peculiarity) + ' ';
		}
		Name += GetWeaponName(Weapon);

		// Applying modifiers
		Arg1 = ApplyModifiers(Price, GetDataArray("wdmg")[Weapon], GetDataArray("wpeculdmg")[Peculiarity], HasPeculiarity);
		Arg2 = ApplyModifiers(Price, GetDataArray("wrof")[Weapon], GetDataArray("wpeculrof")[Peculiarity], HasPeculiarity);
		Arg3 = ApplyModifiers(Price, GetDataArray("wen")[Weapon], GetDataArray("wpeculen")[Peculiarity], HasPeculiarity);
	}
	if (Type == 1)
	{
		// What armor is this
		var Armor = RandArmor(); //console.log(GetArmorName(Armor));
		var HasPeculiarity = (Math.random() * 3) > 2;
		var Peculiarity = 0;
		if (HasPeculiarity)
		{
			Peculiarity = RandArmorPeculiarity();
			Name += GetArmorPecul(Peculiarity) + ' ';
		}
		Name += GetArmorName(Armor);

		// Applying modifiers
		Arg1 = ApplyModifiers(Price, GetDataArray("afr")[Armor], GetDataArray("apeculfr")[Peculiarity], HasPeculiarity);
		Arg2 = ApplyModifiers(Price, GetDataArray("abk")[Armor], GetDataArray("apeculbk")[Peculiarity], HasPeculiarity);
		Arg3 = ApplyModifiers(Price, GetDataArray("awt")[Armor], GetDataArray("apeculwt")[Peculiarity], HasPeculiarity);
	}
	if (Type == 2)
	{
		// What core is this
		var Core = RandCore(); //console.log(GetCoreName(Core));
		var HasPeculiarity = (Math.random() * 3) > 2;
		var Peculiarity = 0;
		if (HasPeculiarity)
		{
			Peculiarity = RandCorePeculiarity();
			Name += GetCorePecul(Peculiarity) + ' ';
		}
		Name += GetCoreName(Core);

		// Applying modifiers
		Arg1 = ApplyModifiers(Price, GetDataArray("cen")[Core], GetDataArray("cpeculen")[Peculiarity], HasPeculiarity);
		Arg2 = ApplyModifiers(Price, GetDataArray("cwt")[Core], GetDataArray("cpeculwt")[Peculiarity], HasPeculiarity);
		Arg3 = ApplyModifiers(Price, GetDataArray("cman")[Core], GetDataArray("cpeculman")[Peculiarity], HasPeculiarity);
	}

	if (Arg1 == NaN || Arg1 == null) Arg1 = 1;
	if (Arg2 == NaN || Arg2 == null) Arg2 = 1;
	if (Arg3 == NaN || Arg3 == null) Arg3 = 1;

	// Other
	var authorID = receivedMessage.author.id;
	var Place = 0; // Place it in the inventory, not on the mech
	Name += ' Ур. 1';

	// Creating an item
	try
	{
		var item = await Items.create(
		{
			name: Name,
			UID: authorID,
			type: Type,
			place: Place,
			price: Price,
			arg1: Arg1,
			arg2: Arg2,
			arg3: Arg3
		});
		return item;
	}
	catch (e)
	{
		receivedMessage.reply('Something went wrong with adding an item: ' + e.name);
	}
}

// Get user's Unit balance
async function GetBalance(id)
{
	// Finding user's balance in the bank
	const Balance = await Bank.findOne({ where: { UID: id } });

	if (Balance) // If there is one
	{
		return Balance.units; // Return the amount of Units
	}
	else // If the user doesn't own a bank balance yet
	{
		await Bank.create( // Create one
			{
				UID: id,
				units: 0
			});
		return 0;
	}
}

// Set user's Unit balance
async function SetBalance(id, value)
{
	// Find user's balance, it always exists if there's a need to adjust it, cuz we call GetBalance before
	const Balance = await Bank.findOne({ where: { UID: id } });
	Balance.update( {units: value} ); // Set new balance
}

// Get a string for a specific item to show
async function GetItemString(receivedMessage, item, showLimits, showTag = true, showDPM = false)
{
	// Types:
	// 0 - Weapon
	// 1 - Armor
	// 2 - Core
	var str = '';

	// Get mech stats
	var mechEnergy = await GetMechEnergy(receivedMessage);
	var mechWeight = await GetMechWeight(receivedMessage);
	var mechSpeed = await GetMechSpeed(receivedMessage);

	if (item.type == 0) // If it's a weapon
	{		
		if (showTag)
		{
			str += '[О]'; // Show the tag
			if (item.place > 0) str += '[' + GetMechPart(item.place, false) + ']'; // Show if it's on the mech
		}
		str += '*' + item.name + '*: ' + item.price + 'Ю, ' + item.arg1 + ' урона, ' + item.arg2 + ' ВВМ, ' + item.arg3 + ' энергии'; // Show the stats
		if (showDPM) str += ' (' + (item.arg1 * item.arg2) + ' УВМ)'; // Show it's DPM
		return str;
	}
	if (item.type == 1) //  If it's armor
	{
		if (showTag)
		{
			str += '[Б]';
			if (item.place > 0) str += '[' + GetMechPart(item.place, false) + ']';
		}
		str += '*' + item.name + '*: ' + item.price + 'Ю, ' + item.arg1 + ' спереди, ' + item.arg2 + ' сзади, ' + item.arg3 + ' кг';
		return str;
	}
	if (item.type == 2) // If it's a core
	{
		if (showTag)
		{
			str += '[Я]';
			if (item.place > 0) str += '[' + GetMechPart(item.place, false) + ']';
		}
		str += '*' + item.name + '*: ' + item.price + 'Ю, ';
		if (showLimits) str += mechEnergy + '/'; // Show energy / max
		str += item.arg1 + ' макс. энергии, ';
		if (showLimits) str += mechWeight + '/'; // Show weight / max
		str += item.arg2 + ' кг макс. массы, ' + item.arg3 + ' базовой скорости';
		if (showLimits) str += ' (' + mechSpeed + ' настоящей скорости)'; // Show mech's speed
		return str;
	}
}

// Buying a specific item
async function BuyItem(receivedMessage)
{
	var authorID = receivedMessage.author.id; // Get user's ID
	var balanceUnits = await GetBalance(authorID);	// Get user's balance

	// Get the price the player's willing to pay
	var price = receivedMessage.content.slice(4); console.log(price);

	if (price < 30)
	{
		receivedMessage.channel.send('Потратить можно только не менее 30-ти Юнитов!');
		return;
	}

	if (price <= balanceUnits) // If there's enough money
	{
		var item = await AddItem(receivedMessage, Math.floor(price / 3));
		await SetBalance(authorID, balanceUnits - price); // Deduct money
		str += 'Покупка успешна, новый баланс ' + (balanceUnits - price) + ' Юнитов!/n';
		receivedMessage.channel.send(str); // Show it was successful
		GetItemString(receivedMessage, item, false, true, true);
	}
	else // If not enough funds
	{
		receivedMessage.channel.send('Недостаточно средств, нужно на ' + (price - balanceUnits) + 'Ю больше!'); // Show there was not enough funds
	}
}

// Get a string for a default item in a certain mech's slot
async function GetDefaultString(receivedMessage, place)
{
	// String to be filled for the final one depending on the item's type
	var arg1Str = '';
	var arg2Str = '';
	var arg3Str = '';
	var statStr = '';

	// Stats
	var mechEnergy = await GetMechEnergy(receivedMessage);
	var mechWeight = await GetMechWeight(receivedMessage);
	var mechSpeed = await GetMechSpeed(receivedMessage);

	// Optional strings for the core
	var enStr = '';
	var wtStr = '';

	// The default item's stats
	var defArg1 = GetDataArray("defarg1")[place - 1];
	var defArg2 = GetDataArray("defarg2")[place - 1];
	var defArg3 = GetDataArray("defarg3")[place - 1];

	// If placing in the CT
	if (place == 1)
	{
		// It's a core
		enStr = mechEnergy + '/';
		wtStr = mechWeight + '/';
		arg1Str = ' макс. энергии, ';
		arg2Str = ' кг макс. массы, ';
		arg3Str = ' базовой скорости';
		statStr = ' (' + mechSpeed + ' настоящей скорости)';
	}
	if (place == 2 || place == 6 || place == 7) // If it's LT, LL or RL
	{
		// It's an armor
		arg1Str = ' спереди, ';
		arg2Str = ' сзади, ';
		arg3Str = ' кг';
	}
	if (place == 3 || place == 4 || place == 5) // If it's RT, LA or RA
	{
		// It's a weapon
		arg1Str = ' урона, ';
		arg2Str = ' ВВМ, ';
		arg3Str = ' энергии';
		statStr = ' (' + (defArg1 * defArg2) + ' УВМ)';
	}

	return (GetDefaultName(place) + ': Бесплатно, ' + enStr + defArg1 + arg1Str + wtStr + defArg2 + arg2Str + defArg3 + arg3Str + statStr); // Return the final string
}

// Show user's inventory
async function ShowInventory(receivedMessage)
{
	var str = ''; // Initiate a string to show

	var authorID = receivedMessage.author.id; // Get user's ID
	var balance = await GetBalance(authorID); // Get their balance
	str += 'Баланс: ' + balance + 'Ю\n'; // Show their balance

	const AllItems = await Items.findAll({ where: { UID: authorID } }); // Get all user's items

	if (AllItems.length == 0) // If there are no items yet
	{
		str += 'Ваш инвентарь пуст!'; // Say the inventory's empty
		receivedMessage.channel.send(str); // Show the global string
		return; // And don't try to show the items
	}

	var ShowingLength = 30;
	if (AllItems.length <= 30) ShowingLength = AllItems.length;
	else str += '**Первые 30 предметов**\n';

	for (var i = 0; i < ShowingLength; i++) // For every item
	{
		if (AllItems[i].place > 0 ) str += '[' + (i+1) + ']' + await GetItemString(receivedMessage, AllItems[i], true, true, true) + '\n'; // Add their strings to the global one
		else str += '[' + (i+1) + ']' + await GetItemString(receivedMessage, AllItems[i], false, true, true) + '\n';
	}

	receivedMessage.channel.send(str); // Show the global string
}

// Upgrading a specific item
async function UpgradeItem(receivedMessage, index)
{
	var authorID = receivedMessage.author.id; // Get user's ID
	const AllItems = await Items.findAll({ where: { UID: authorID } }); // Get their items

	if (index >= AllItems.length) // If the item index is out of bounds
	{
		receivedMessage.channel.send("Предмета под таким номером нет в вашем инвентаре!"); // Say it's out of bounds
		return;
	}

	if (AllItems[index]) // If there is such an object (there should be)
	{
		var thisItem = AllItems[index]; // Place it in a more easy-to-write variable

		var balanceUnits = await GetBalance(authorID);	// Get user's balance
		var curPrice = thisItem.price; // Get the item's price

		if (curPrice <= balanceUnits) // If there's enough money
		{
			// Checking so core won't break
			if (thisItem.type == 0)
			{
				var mechEnergyLimit = await GetMechArg(receivedMessage, 1, 1);
				var mechEnergy = await GetMechEnergy(receivedMessage);
				var mechFreeEnergy = mechEnergyLimit - mechEnergy;
				var energyGain = Math.ceil(thisItem.arg3 * 0.6);

				if (energyGain > mechFreeEnergy && thisItem.place != 0)
				{
					receivedMessage.channel.send("Ядру нужно на " + (energyGain - mechFreeEnergy) + ' больше энергии для этого апгрейда!');
					return;
				}
			}
			if (thisItem.type == 1)
			{
				var mechWeightLimit = await GetMechArg(receivedMessage, 1, 2);
				var mechWeight = await GetMechWeight(receivedMessage);
				var mechFreeWeight = mechWeightLimit - mechWeight;
				var weightGain = Math.ceil(thisItem.arg3 * 0.6);

				if (weightGain > mechFreeWeight && thisItem.place != 0)
				{
					receivedMessage.channel.send("Ядру нужно на " + (weightGain - mechFreeWeight) + ' кг грузоподъёмности для этого апгрейда!');
					return;
				}
			}

			// Adjust the stats
			var newPrice = Math.ceil(thisItem.price * 1.9);
			var newArg1 = Math.ceil(thisItem.arg1 * 1.6);
			var newArg2 = Math.ceil(thisItem.arg2 * 1.6);
			var newArg3 = Math.ceil(thisItem.arg3 * 1.6);

			// Document the upgrade
			var str = '**Улучшение ' + thisItem.name + ':**\n';

			if (thisItem.type == 0)
			{
				str += 'Урон: ' + thisItem.arg1 + ' -> ' + newArg1 + '\n';
				str += 'ВВМ: ' + thisItem.arg2 + ' -> ' + newArg2 + '\n';
				str += 'Энергия: ' + thisItem.arg3 + ' -> ' + newArg3 + '\n';
				str += 'Цена: ' + thisItem.price + ' -> ' + newPrice + 'Ю\n';
			}
			if (thisItem.type == 1)
			{
				str += 'Передняя Защита: ' + thisItem.arg1 + ' -> ' + newArg1 + '\n';
				str += 'Задняя Защита: ' + thisItem.arg2 + ' -> ' + newArg2 + '\n';
				str += 'Масса: ' + thisItem.arg3 + ' -> ' + newArg3 + ' кг\n';
				str += 'Цена: ' + thisItem.price + ' -> ' + newPrice + 'Ю\n';
			}
			if (thisItem.type == 2)
			{
				str += 'Энергоёмкость: ' + thisItem.arg1 + ' -> ' + newArg1 + '\n';
				str += 'Грузоподъёмность: ' + thisItem.arg2 + ' -> ' + newArg2 + ' кг\n';
				str += 'Базовая скорость: ' + thisItem.arg3 + ' -> ' + newArg3 + '\n';
				str += 'Цена: ' + thisItem.price + ' -> ' + newPrice + 'Ю\n';
			}

			// Change the level
			var newName = thisItem.name;
			var dotPlace = newName.lastIndexOf('.');
			var level = newName.substr(dotPlace + 2);
			newName = newName.substr(0, dotPlace + 2);
			level++;
			newName += level;

			await thisItem.update({price: newPrice, arg1: newArg1, arg2: newArg2, arg3: newArg3, name: newName}); // Upgrade the item
			await SetBalance(authorID, balanceUnits - curPrice); // Deduct money
			str += 'Улучшение успешно, новый баланс ' + (balanceUnits - curPrice) + ' Юнитов!';
			receivedMessage.channel.send(str); // Show it was successful
		}
		else // If not enough funds
		{
			receivedMessage.channel.send('Недостаточно средств, нужно на ' + (curPrice - balanceUnits) + 'Ю больше!'); // Show there was not enough funds
		}
	}
}

// Sell a specific item
async function SellItem(receivedMessage, index)
{
	var authorID = receivedMessage.author.id; // Get user's id
	const AllItems = await Items.findAll({ where: { UID: authorID } }); // Get user's items

	if (index >= AllItems.length) // If the item index is out of bounds
	{
		receivedMessage.channel.send("Предмета под таким номером нет в вашем инвентаре!"); // Say it's out of bounds
		return;
	}

	if (AllItems[index]) // If the item's ok
	{
		var thisItem = AllItems[index]; // Put it in a variable for shits and giggles
		var itemPrice = Math.floor(thisItem.price / 2); // Get its price
		var balanceUnits = await GetBalance(authorID); // Get user's balance

		if (thisItem.place == 1)
		{
			if (await GetDataArray("defarg1")[0] < await GetMechEnergy(receivedMessage))
			{
				receivedMessage.channel.send("У вашего меха не хватит энергоёмкости, не могу продать!");
				return;
			}
			if (await GetDataArray("defarg2")[0] < await GetMechWeight(receivedMessage))
			{
				receivedMessage.channel.send("У вашего меха не хватит грузоподъёмности, не могу продать!");
				return;
			}
		}

		// Successful sell
		await thisItem.destroy(); // Remove the item
		await SetBalance(authorID, balanceUnits + itemPrice); // Add the funds
		receivedMessage.channel.send('Успешно продано за ' + itemPrice + ' Юнитов, новый баланс - ' + (balanceUnits + itemPrice) + 'Ю!'); // Say it was successful
	}
}

// Sell all non-installed items
async function SellNotInstalled(receivedMessage)
{
	var authorID = receivedMessage.author.id; // Get user's id
	const AllItems = await Items.findAll({ where: { UID: authorID, place: 0 } }); // Get user's unused items

	if (AllItems.length == 0)
	{
		receivedMessage.channel.send("В вашем инвентаре нет неиспользуемых предметов!");
		return;
	}

	var startbalanceUnits = await GetBalance(authorID); // Get user's balance to track global sell stat

	for (var i = 0; i < AllItems.length; i++)
	{
		var thisItem = AllItems[i]; // Put it in a variable for shits and giggles
		var itemPrice = Math.floor(thisItem.price / 2); // Get its price
		var balanceUnits = await GetBalance(authorID); // Get user's balance

		// Successful sell
		await thisItem.destroy(); // Remove the item
		await SetBalance(authorID, balanceUnits + itemPrice); // Add the funds
	}

	var newbalanceUnits = await GetBalance(authorID); // New user's balance
	receivedMessage.channel.send('Успешно продано ' + AllItems.length + ' предметов за ' + (newbalanceUnits - startbalanceUnits) + ' Юнитов, новый баланс - ' + newbalanceUnits + 'Ю!'); // Say it was successful
}

// Show user's mech
async function ShowMech(receivedMessage)
{
	var str = "Мех игрока " + receivedMessage.author.username + ":\n"; // User's name

	// List all of the mech's parts
	str += await GetPartString(receivedMessage, 1, 'ЦТ') + '\n';
	str += await GetPartString(receivedMessage, 2, 'ЛТ') + '\n';
	str += await GetPartString(receivedMessage, 3, 'ПТ') + '\n';
	str += await GetPartString(receivedMessage, 4, 'ЛР') + '\n';
	str += await GetPartString(receivedMessage, 5, 'ПР') + '\n';
	str += await GetPartString(receivedMessage, 6, 'ЛН') + '\n';
	str += await GetPartString(receivedMessage, 7, 'ПН') + '\n';

	// Player stats
	var plFrontArmor = await GetMechFrontArmor(receivedMessage);
	var plBackArmor = await GetMechBackArmor(receivedMessage);
	var plWeaponDPM = WeaponDPM(await GetMechArg(receivedMessage, 4, 1), await GetMechArg(receivedMessage, 4, 2))
	 + WeaponDPM(await GetMechArg(receivedMessage, 5, 1), await GetMechArg(receivedMessage, 5, 2))
	  + (await GetMechArg(receivedMessage, 2, 0) == 0 ? WeaponDPM(await GetMechArg(receivedMessage, 2, 1), await GetMechArg(receivedMessage, 2, 2)) : 0)
	   + (await GetMechArg(receivedMessage, 3, 0) == 0 ? WeaponDPM(await GetMechArg(receivedMessage, 3, 1), await GetMechArg(receivedMessage, 3, 2)) : 0);
	var plSpeed = await GetMechSpeed(receivedMessage);
	str += 'Передняя Защита: ' + plFrontArmor + '\n';
	str += 'Задняя Защита: ' + plBackArmor + '\n';
	str += 'Суммарный УВМ: ' + plWeaponDPM + '\n';
	str += 'Скорость: ' + plSpeed + '\n';

	receivedMessage.channel.send(str);
}

// Get a string for the mech's part
async function GetPartString(receivedMessage, partID, partName)
{
	const Part = await Items.findOne({ where: { UID: receivedMessage.author.id, place: partID } }); // Find a part in a certain mech slot
	var str = partName + ' > ';

	if (Part) // If there is one
	{
		// Show it's string
		str += await GetItemString(receivedMessage, Part, true, false, true);
		return str;
	}
	else // If there is none, set it as a default one
	{
		// Show default part
		str += await GetDefaultString(receivedMessage, partID);
		return str;
	}
}

// Putting an item on a mech
async function PutItem(receivedMessage, data)
{
	// Get the item
	var indexEnd = data.indexOf(' ');
	var index = data.substring(0, indexEnd) - 1;

	// Get the mech's part user's installing the item on
	var partString = data.substring(indexEnd + 1);

	var part = 0;
	if (partString == 'цт') part = 1;
	else if (partString == 'лт') part = 2;
	else if (partString == 'пт') part = 3;
	else if (partString == 'лр') part = 4;
	else if (partString == 'пр') part = 5;
	else if (partString == 'лн') part = 6;
	else if (partString == 'пн') part = 7;
	else
	{
		receivedMessage.channel.send('Часть меха не распознана! Варианты: цт, лт, пт, лр, пр, лн, пн');
		return;
	}

	// Process the item
	var authorID = receivedMessage.author.id; // Get user's ID
	const AllItems = await Items.findAll({ where: { UID: authorID } }); // Get their items

	if (index >= AllItems.length) // If the item index is out of bounds
	{
		receivedMessage.channel.send("Предмета под таким номером нет в вашем инвентаре!"); // Say it's out of bounds
		return;
	}

	if (AllItems[index]) // If there is such an object (there should be)
	{
		var thisItem = AllItems[index]; // Place it in a more easy-to-write variable
		var itemType = thisItem.type;

		// Conditionals, if this mech's part can fit a certain item type
		var partFitsWeapon = part == 2 || part == 3 || part == 4 || part == 5;
		var partFitsArmor = part == 2 || part == 3 || part == 6 || part == 7;
		var partFitsCore = part == 1;

		if (itemType == 0) // If it's a weapon
		{
			if (partFitsWeapon) // And it fits one
			{
				// If it can fit the new weapon with its energy
				var mechEnergyLimit = await GetMechArg(receivedMessage, 1, 1); // Core's energy limit
				var mechSumEnergy = await GetMechEnergy(receivedMessage); // All weapons' energy summed
				var mechEnergySpace = mechEnergyLimit - mechSumEnergy; // Free energy

				// Energy of a part in this mech slot
				var partEnergy;
				if (await GetMechArg(receivedMessage, part, 0) == 0) partEnergy = await GetMechArg(receivedMessage, part, 3);
				else partEnergy = 0;

				var thisEnergy = thisItem.arg3; // New weapon's energy
				var energyRise = thisEnergy - partEnergy; // Gain of energy with the placement

				var energySpaceLeft = mechEnergySpace - energyRise; // How much energy will be left after the installation

				if (energySpaceLeft >= 0) // If energy is sufficient
				{			
					if (part == 2) await InstallItem(receivedMessage, thisItem, 2);
					if (part == 3) await InstallItem(receivedMessage, thisItem, 3);
					if (part == 4) await InstallItem(receivedMessage, thisItem, 4);
					if (part == 5) await InstallItem(receivedMessage, thisItem, 5);
				}
				else
				{
					receivedMessage.channel.send("Вашему меху не хватает " + -energySpaceLeft + " энергии!");
					return;
				}
			}
			else
			{
				receivedMessage.channel.send("Установить сюда оружие невозможно!");
				return;
			}
		}
		if (itemType == 1) // If it's an armor
		{
			if (partFitsArmor)
			{
				var mechWeightLimit = await GetMechArg(receivedMessage, 1, 2); // Core's weight limit
				var mechSumWeight = await GetMechWeight(receivedMessage); // Armor summed weight
				var mechWeightSpace = mechWeightLimit - mechSumWeight; // Free weight

				// Weight of the item currently installed in this mech slot
				var partWeight;
				if (await GetMechArg(receivedMessage, part, 0) == 1) partWeight = await GetMechArg(receivedMessage, part, 3);
				else partWeight = 0;

				var thisWeight = thisItem.arg3; // New item's weight
				var weightRise = thisWeight - partWeight; // Weight gain

				var weightSpaceLeft = mechWeightSpace - weightRise; // How much weight will be left available after the installation

				if (weightSpaceLeft >= 0) // If weight cap is sufficient
				{			
					// If weight limit is sufficient
					if (part == 2) await InstallItem(receivedMessage, thisItem, 2);
					if (part == 3) await InstallItem(receivedMessage, thisItem, 3);
					if (part == 6) await InstallItem(receivedMessage, thisItem, 6);
					if (part == 7) await InstallItem(receivedMessage, thisItem, 7);
				}
				else
				{
					receivedMessage.channel.send("Вашему меху не хватает " + -weightSpaceLeft + " кг грузоподъёмности!");
					return;
				}
			}
			else
			{
				receivedMessage.channel.send("Установить сюда броню невозможно!");
				return;
			}
		}
		if (itemType == 2) // If it's a core
		{
			if (partFitsCore)
			{
				// If the new core will fit mech's energy and weight then it's ok
				var mechSumEnergy = await GetMechEnergy(receivedMessage);
				var thisEnergyLimit = thisItem.arg1;
				var energySpaceLeft = thisEnergyLimit - mechSumEnergy;

				var mechSumWeight = await GetMechWeight(receivedMessage);
				var thisWeightLimit = thisItem.arg2;
				var weightSpaceLeft = thisWeightLimit - mechSumWeight;

				// Abort if it won't
				if (energySpaceLeft < 0)
				{
					receivedMessage.channel.send("Вашему меху не будет хватать " + -energySpaceLeft + " энергии!");
					return;
				}

				if (weightSpaceLeft < 0)
				{
					receivedMessage.channel.send("Вашему меху не будет хватать " + -weightSpaceLeft + " кг грузоподъёмности!");
					return;
				}

				await InstallItem(receivedMessage, thisItem, 1);
			}
			else
			{
				receivedMessage.channel.send("Установить сюда ядро неовзможно!");
				return;
			}
		}
	}
}

// Install the item into the slot
async function InstallItem(receivedMessage, item, part)
{
	// Remove the old part
	var authorID = receivedMessage.author.id; // Get user's ID
	const AllItems = await Items.findAll({ where: { UID: authorID, place: part } }); // Get their items

	if (AllItems.length != 0) // If there is an old part
	{
		var oldItem = AllItems[0]; // Place it in a more easy-to-write variable
		await oldItem.update({ place: 0 });
	}

	// Successful Installation
	await item.update({ place: part });

	var partString = GetMechPart(part, true);
	receivedMessage.channel.send(item.name + " установлен в " + partString + '!');
}

// Get a mech part's argument or its type with arg == 0
async function GetMechArg(receivedMessage, part, arg)
{
	var authorID = receivedMessage.author.id; // Get user's ID
	const AllItems = await Items.findAll({ where: { UID: authorID, place: part} }); // Get the item in this mech slot

	if (AllItems.length == 0) // If there is none then get data from the default item
	{
		if (arg == 0)
		{
			if (part == 1) return 2;
			if (part == 2 || part == 6 || part == 7) return 1;
			if (part == 3 || part == 4 || part == 5) return 0;
		}
		if (arg == 1) return GetDataArray("defarg1")[part - 1];
		if (arg == 2) return GetDataArray("defarg2")[part - 1];
		if (arg == 3) return GetDataArray("defarg3")[part - 1];
	}
	else // If it exists, get it then
	{
		if (arg == 0) return AllItems[0].type;
		if (arg == 1) return AllItems[0].arg1;
		if (arg == 2) return AllItems[0].arg2;
		if (arg == 3) return AllItems[0].arg3;
	}
}

async function GetMechArgID(authorID, part, arg)
{
	const AllItems = await Items.findAll({ where: { UID: authorID, place: part} }); // Get the item in this mech slot

	if (AllItems.length == 0) // If there is none then get data from the default item
	{
		if (arg == 0)
		{
			if (part == 1) return 2;
			if (part == 2 || part == 6 || part == 7) return 1;
			if (part == 3 || part == 4 || part == 5) return 0;
		}
		if (arg == 1) return GetDataArray("defarg1")[part - 1];
		if (arg == 2) return GetDataArray("defarg2")[part - 1];
		if (arg == 3) return GetDataArray("defarg3")[part - 1];
	}
	else // If it exists, get it then
	{
		if (arg == 0) return AllItems[0].type;
		if (arg == 1) return AllItems[0].arg1;
		if (arg == 2) return AllItems[0].arg2;
		if (arg == 3) return AllItems[0].arg3;
	}
}

// --- Mech Stats ---
async function GetMechWeight(receivedMessage)
{
	var res = 0;
	res += await GetMechArg(receivedMessage, 6, 3);
	res += await GetMechArg(receivedMessage, 7, 3);

	if (await GetMechArg(receivedMessage, 2, 0) == 1) res += await GetMechArg(receivedMessage, 2, 3);
	if (await GetMechArg(receivedMessage, 3, 0) == 1) res += await GetMechArg(receivedMessage, 3, 3);

	return res;
}

async function GetMechWeightID(authorID)
{
	var res = 0;
	res += await GetMechArgID(authorID, 6, 3);
	res += await GetMechArgID(authorID, 7, 3);

	if (await GetMechArgID(authorID, 2, 0) == 1) res += await GetMechArgID(authorID, 2, 3);
	if (await GetMechArgID(authorID, 3, 0) == 1) res += await GetMechArgID(authorID, 3, 3);

	return res;
}


async function GetMechEnergy(receivedMessage)
{
	var res = 0;
	res += await GetMechArg(receivedMessage, 4, 3);
	res += await GetMechArg(receivedMessage, 5, 3);

	if (await GetMechArg(receivedMessage, 2, 0) == 0) res += await GetMechArg(receivedMessage, 2, 3);
	if (await GetMechArg(receivedMessage, 3, 0) == 0) res += await GetMechArg(receivedMessage, 3, 3);

	return res;
}

async function GetMechFrontArmor(receivedMessage)
{
	var res = 0;
	res += await GetMechArg(receivedMessage, 6, 1);
	res += await GetMechArg(receivedMessage, 7, 1);

	if (await GetMechArg(receivedMessage, 2, 0) == 1) res += await GetMechArg(receivedMessage, 2, 1);
	if (await GetMechArg(receivedMessage, 3, 0) == 1) res += await GetMechArg(receivedMessage, 3, 1);

	return res;
}

async function GetMechBackArmor(receivedMessage)
{
	var res = 0;
	res += await GetMechArg(receivedMessage, 6, 2);
	res += await GetMechArg(receivedMessage, 7, 2);

	if (await GetMechArg(receivedMessage, 2, 0) == 1) res += await GetMechArg(receivedMessage, 2, 2);
	if (await GetMechArg(receivedMessage, 3, 0) == 1) res += await GetMechArg(receivedMessage, 3, 2);

	return res;
}

async function GetMechSpeed(receivedMessage)
{
	var weight = await GetMechWeight(receivedMessage);
	var weightLimit = await GetMechArg(receivedMessage, 1, 2);
	var baseSpeed = await GetMechArg(receivedMessage, 1, 3);

	var res = Math.floor(baseSpeed * (2 - (weight / weightLimit)));
	return res;
}

async function GetMechFrontArmorID(authorID)
{
	var res = 0;
	res += await GetMechArgID(authorID, 6, 1);
	res += await GetMechArgID(authorID, 7, 1);

	if (await GetMechArgID(authorID, 2, 0) == 1) res += await GetMechArgID(authorID, 2, 1);
	if (await GetMechArgID(authorID, 3, 0) == 1) res += await GetMechArgID(authorID, 3, 1);

	return res;
}

async function GetMechBackArmorID(authorID)
{
	var res = 0;
	res += await GetMechArgID(authorID, 6, 2);
	res += await GetMechArgID(authorID, 7, 2);

	if (await GetMechArgID(authorID, 2, 0) == 1) res += await GetMechArgID(authorID, 2, 2);
	if (await GetMechArgID(authorID, 3, 0) == 1) res += await GetMechArgID(authorID, 3, 2);

	return res;
}

async function GetMechSpeedID(authorID)
{
	var weight = await GetMechWeightID(authorID);
	var weightLimit = await GetMechArgID(authorID, 1, 2);
	var baseSpeed = await GetMechArgID(authorID, 1, 3);

	var res = Math.floor(baseSpeed * (2 - (weight / weightLimit)));
	return res;
}


async function GetMechPrice(receivedMessage)
{
	var authorID = receivedMessage.author.id;
	const AllItems = await Items.findAll({ where: { UID: authorID, place: [1, 2, 3, 4, 5, 6, 7] } }); // Get user's installed items

	var res = 0;

	for (var i = 0; i < AllItems.length; i++)
	{
		var thisItem = AllItems[i]; // Put it in a variable for shits and giggles
		var itemPrice = thisItem.price; // Get its price

		res += itemPrice;
	}

	for (var i = AllItems.length; i < 9; i++)
	{
		res += 10;
	}

	return res;
}

function WeaponDPM(damage, rpm)
{
	return (damage * rpm);
}

// --- Randomness ---

// Get one of the possible outcomes using points as dibs
// Outcome with 10 points is 10x more likely than an outcome with 1 point
// points is an array of integers, function returns the chosen index
function RandomByPoints(points)
{
	var PossibilitiesCount = points.length;
	var MaxPoints = 0;

	for (var i = 0; i < PossibilitiesCount; i++)
	{
		MaxPoints += points[i];
	}

	var RandomizedPoints = Math.floor(Math.random() * MaxPoints);
	for (var i = 0; i < PossibilitiesCount; i++)
	{
		if (RandomizedPoints < points[i])
		{
			return i;
		}
		else
		{
			RandomizedPoints -= points[i];
		}
	}
}

function RandItemType()
{
	return RandomByPoints(GetDataArray("typespoints"));
}

function RandWeapon()
{
	return RandomByPoints(GetDataArray("wpoints"));
}

function RandWeaponPeculiarity()
{
	return RandomByPoints(GetDataArray("wpeculpoints"));
}

function RandArmor()
{
	return RandomByPoints(GetDataArray("apoints"));
}

function RandArmorPeculiarity()
{
	return RandomByPoints(GetDataArray("apeculpoints"));
}

function RandCore()
{
	return RandomByPoints(GetDataArray("cpoints"));
}

function RandCorePeculiarity()
{
	return RandomByPoints(GetDataArray("cpeculpoints"));
}

// --- Game databanks ---

function ApplyModifiers(base, type, pecul, hasPecul)
{
	if (base == null) return 1;
	var res = base;

	res *= type;
	if (hasPecul) res *= pecul;

	var GreatestRNG = 0.75 + (Math.random() * 0.45);
	res *= GreatestRNG;

	res = Math.floor(res);
	if (res < 1) return 1;
	if (res == NaN) return 1;
	if (res == null) return 1;
	return res;
}

function GetWeaponName(ID)
{
	switch(ID)
	{
		case 0: return 'Пулемёт';
		case 1: return 'Авто-пушка';
		case 2: return 'Рейлган';
		case 3: return 'Пушка Гаусса';
		case 4: return 'Пусковая Установка';
		case 5: return 'Ракетное Сило';
		case 6: return 'Малый Лазер';
		case 7: return 'Средний Лазер';
		case 8: return 'Большой Лазер';
		case 9: return 'Гаубица';
		case 10: return 'Дробовое Орудие';
	}
}

function GetWeaponPecul(ID)
{
	switch(ID)
	{
		case 0: return 'Тяжёлый';
		case 1: return 'Легковесный';
		case 2: return 'Оптимизированный';
		case 3: return 'Скорострельный';
		case 4: return 'Стабилизированный';
		case 5: return 'Повреждённый';
		case 6: return 'Заедающий';
		case 7: return 'Закалённый в боях';
		case 8: return 'Аугментированный';
		case 9: return 'Проверенный';
		case 10: return 'Особенный';
		case 11: return 'Ветеранский';
		case 12: return 'Легендарный';
		case 13: return 'Невозможный';
	}
}

function GetArmorName(ID)
{
	switch(ID)
	{
		case 0: return 'Катанная Стальная';
		case 1: return 'Алюминиевая';
		case 2: return 'Титановая';
		case 3: return 'Из Обеднённого Урана';
		case 4: return 'Пластиковая';
		case 5: return 'Керамическая';
		case 6: return 'Композитная';
	}
}

function GetArmorPecul(ID)
{
	switch(ID)
	{
		case 0: return 'Усиленная';
		case 1: return 'Поношенная';
		case 2: return 'Лёгкая';
		case 3: return 'Улучшенная';
		case 4: return 'Исцарапанная';
		case 5: return 'С передним усилением';
		case 6: return 'Сбалансированная';
		case 7: return 'Уникальная';
		case 8: return 'Сертифицированная';
		case 9: return 'Продвинутая';
		case 10: return 'Экспериментальная';
	}
}

function GetCoreName(ID)
{
	switch(ID)
	{
		case 0: return 'Дизельное';
		case 1: return 'Газотурбинное';
		case 2: return 'Турбовентиляторное';
		case 3: return 'Ядерный Реактор';
		case 4: return 'Термоядерный Реактор';
	}
}

function GetCorePecul(ID)
{
	switch(ID)
	{
		case 0: return 'С форсажной камерой';
		case 1: return 'Ускоренное';
		case 2: return 'Перезаряженное';
		case 3: return 'Поношенное';
		case 4: return 'Улучшенное';
		case 5: return 'Редкое';
		case 6: return 'Лучшее';
	}
}

function GetMechPart(ID, full)
{
	if (full)
	{
		switch (ID)
		{
			case 1: return 'Центральный Торс';
			case 2: return 'Левый Торс';
			case 3: return 'Правый Торс';
			case 4: return 'Левая Рука';
			case 5: return 'Правая Рука';
			case 6: return 'Левая Нога';
			case 7: return 'Правая Нога';
		}
	}
	else
	{
		switch (ID)
		{
			case 1: return 'ЦТ';
			case 2: return 'ЛТ';
			case 3: return 'ПТ';
			case 4: return 'ЛР';
			case 5: return 'ПР';
			case 6: return 'ЛН';
			case 7: return 'ПН';
		}
	}
}

// Default parts
function GetDefaultName(part)
{
	switch (part)
	{
		case 1: return "*Базовый Реактор*";
		case 2: return "*Каркас*";
		case 3: return "*Базовый Пулемёт*";
		case 4: return "*Базовый Пулемёт*";
		case 5: return "*Базовый Пулемёт*";
		case 6: return "*Каркас*";
		case 7: return "*Каркас*";
	}
}

// Returns an array of the data from the database, placed inside of it, duh
function GetDataArray(type)
{
	switch(type)
	{
		// General
		case "typespoints": return [5, 5, 1]; //wac

		// Default arguments
		case "defarg1":  return [50, 300, 1, 1, 1, 300, 300];
		case "defarg2":  return [300, 100, 100, 100, 100, 100, 100];
		case "defarg3":  return [100, 50, 10, 10, 10, 50, 50];

		// Weapons
		case "wpoints": return [12, 7, 3, 3, 6, 5, 7, 7, 5, 4, 4];
		case "wdmg": return [0.1, 0.25, 1.5, 2, 0.2, 4, 0.15, 0.35, 0.6, 3, 2.5];
		case "wrof": return [2.5, 1.25, 0.25, 0.13, 2, 0.13, 1.5, 1, 0.5, 0.1, 0.15];
		case "wen": return [1, 1.6, 2.2, 1, 2.5, 4, 1, 1.9, 1.4, 1.4, 2.2];

		// Weapon peculiarities
		case "wpeculpoints": return [10, 10, 7, 8, 7, 9, 7, 6, 5, 7, 6, 4, 3, 1];
		case "wpeculdmg": return [2, 0.5, 1.1, 1, 1.8, 0.7, 0.5, 1.5, 1, 1.2, 1.5, 2, 3.2, 5];
		case "wpeculrof": return [0.7, 2.5, 1.1, 2, 0.9, 0.7, 0.3, 1, 2, 1.2, 1.5, 2, 3.2, 5];
		case "wpeculen": return [1, 1, 0.7, 1.7, 0.8, 1, 0.8, 0.9, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5];

		// Armors
		case "apoints": return [10, 7, 6, 4, 4, 5, 4];
		case "afr": return [50, 35, 80, 70, 10, 20, 70];
		case "abk": return [10, 8, 20, 5, 10, 5, 70];
		case "awt": return [5, 3, 9, 5, 1, 2, 11];

		// Armor peculiarities
		case "apeculpoints": return [10, 9, 8, 8, 6, 5, 6, 4, 3, 2, 1];
		case "apeculfr": return [1.5, 0.8, 0.7, 1.4, 0.9, 3, 0.5, 1.4, 2, 3.6, 5];
		case "apeculbk": return [1.5, 0.8, 0.7, 1.2, 0.7, 0.3, 2, 1.4, 3.6, 5];
		case "apeculwt": return [1.3, 0.8, 0.5, 1, 1, 1, 0.9, 0.9, 0.8, 0.7, 0.6];

		// Cores
		case "cpoints": return [3, 4, 5, 4, 3];
		case "cen": return [2.5, 4, 5, 8, 12];
		case "cwt": return [40, 25, 20, 15, 12];
		case "cman": return [20, 12, 10, 8, 4];

		// Cores peculiarities
		case "cpeculpoints": return [10, 10, 10, 5, 3, 2, 1];
		case "cpeculen": return [0.7, 0.8, 1.4, 0.7, 1.3, 1.6, 2];
		case "cpeculwt": return [0.9, 1.2, 0.7, 0.7, 1.3, 1.6, 2];
		case "cpeculman": return [1.4, 1, 0.8, 0.6, 1.3, 1.6, 2];

		default:
			{
				console.log('Default in a number database!');
				return 1;
			}
	}
}

// Getting a MESSAGE
client.on('message', message =>
{
	if (message.content.startsWith(Prefix))
	{
		// Message without prefix = Final message
		var msg = message.content.substring(2);
		
		ProcessMessage(message, msg);
	}
});

// IN THE END
client.login('NzAxMTQ5MjgwMTE4NzY3NjU3.XqAe6A.F1DEAxOojeMK8mgFKLuqhh1D_SI');
