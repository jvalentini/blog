export interface YotoAudiobookChapterConfig {
	readonly id: string;
	readonly title: string;
	readonly filePath: string;
	readonly durationSeconds: number;
}

export interface YotoAudiobookConfig {
	readonly id: string;
	readonly playlistName: string;
	readonly feedTitle: string;
	readonly authorName: string;
	readonly publishedAt: string;
	readonly sourceUrl: string;
	readonly licenseLabel: string;
	readonly sourceNote: string;
	readonly chapters: readonly YotoAudiobookChapterConfig[];
}

export const YOTO_AUDIOBOOK_CONFIGS = [
	{
		id: 'little-red-riding-hood',
		playlistName: 'Little Red Riding Hood',
		feedTitle: "Little Red Riding Hood - 6 More Favourite Children's Stories",
		authorName: "Robin Lucas Children's Theatre",
		publishedAt: '2026-01-28T00:00:00.000Z',
		sourceUrl:
			'https://archive.org/details/little-red-riding-hood-6-more-favourite-childrens-stories-1985-full-audioca',
		licenseLabel: 'Creative Commons BY-ND 4.0',
		sourceNote:
			'Archive.org metadata lists this recording under Creative Commons BY-ND 4.0; the MP3 files are mirrored unchanged.',
		chapters: [
			{
				id: 'little-red-riding-hood-the-little-red-engine',
				title: 'The Little Red Engine',
				filePath: 'audiobooks/little-red-riding-hood/01-the-little-red-engine.mp3',
				durationSeconds: 368,
			},
			{
				id: 'little-red-riding-hood-robin-hood',
				title: 'Robin Hood',
				filePath: 'audiobooks/little-red-riding-hood/02-robin-hood.mp3',
				durationSeconds: 439,
			},
			{
				id: 'little-red-riding-hood-jack-and-the-beanstalk',
				title: 'Jack & The Beanstalk',
				filePath: 'audiobooks/little-red-riding-hood/03-jack-and-the-beanstalk.mp3',
				durationSeconds: 475,
			},
			{
				id: 'little-red-riding-hood-pinocchio',
				title: 'Pinocchio',
				filePath: 'audiobooks/little-red-riding-hood/04-pinocchio.mp3',
				durationSeconds: 470,
			},
			{
				id: 'little-red-riding-hood-little-red-riding-hood',
				title: 'Little Red Riding Hood',
				filePath: 'audiobooks/little-red-riding-hood/05-little-red-riding-hood.mp3',
				durationSeconds: 389,
			},
			{
				id: 'little-red-riding-hood-three-little-pigs',
				title: 'Three Little Pigs',
				filePath: 'audiobooks/little-red-riding-hood/06-three-little-pigs.mp3',
				durationSeconds: 371,
			},
		],
	},
	{
		id: 'uncle-wiggily-story-book',
		playlistName: "Uncle Wiggily's Story Book",
		feedTitle: "Uncle Wiggily's Story Book",
		authorName: 'Howard R. Garis',
		publishedAt: '2020-03-20T00:00:00.000Z',
		sourceUrl: 'https://archive.org/details/unclewiggilysstorybook_2003_librivox',
		licenseLabel: 'Public Domain Mark 1.0',
		sourceNote: 'Public-domain LibriVox recording mirrored from Archive.org in 64 kbps MP3 chapter files.',
		chapters: [
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-s-toothache',
				title: "Uncle Wiggily's Toothache",
				filePath: 'audiobooks/uncle-wiggily-story-book/01-uncle-wiggily-s-toothache.mp3',
				durationSeconds: 771,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-freckled-girl',
				title: 'Uncle Wiggily and the Freckled Girl',
				filePath: 'audiobooks/uncle-wiggily-story-book/02-uncle-wiggily-and-the-freckled-girl.mp3',
				durationSeconds: 838,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-mud-puddle',
				title: 'Uncle Wiggily and the Mud Puddle',
				filePath: 'audiobooks/uncle-wiggily-story-book/03-uncle-wiggily-and-the-mud-puddle.mp3',
				durationSeconds: 775,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-bad-boy',
				title: 'Uncle Wiggily and the Bad Boy',
				filePath: 'audiobooks/uncle-wiggily-story-book/04-uncle-wiggily-and-the-bad-boy.mp3',
				durationSeconds: 560,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-good-boy',
				title: 'Uncle Wiggily and the Good Boy',
				filePath: 'audiobooks/uncle-wiggily-story-book/05-uncle-wiggily-and-the-good-boy.mp3',
				durationSeconds: 622,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-s-valentine',
				title: "Uncle Wiggily's Valentine",
				filePath: 'audiobooks/uncle-wiggily-story-book/06-uncle-wiggily-s-valentine.mp3',
				durationSeconds: 563,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-bad-dog',
				title: 'Uncle Wiggily and the Bad Dog',
				filePath: 'audiobooks/uncle-wiggily-story-book/07-uncle-wiggily-and-the-bad-dog.mp3',
				durationSeconds: 579,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-puss-in-boots',
				title: 'Uncle Wiggily and Puss in Boots',
				filePath: 'audiobooks/uncle-wiggily-story-book/08-uncle-wiggily-and-puss-in-boots.mp3',
				durationSeconds: 574,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-lost-boy',
				title: 'Uncle Wiggily and the Lost Boy',
				filePath: 'audiobooks/uncle-wiggily-story-book/09-uncle-wiggily-and-the-lost-boy.mp3',
				durationSeconds: 539,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-stubby-toes',
				title: 'Uncle Wiggily and Stubby Toes',
				filePath: 'audiobooks/uncle-wiggily-story-book/10-uncle-wiggily-and-stubby-toes.mp3',
				durationSeconds: 675,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-s-christmas',
				title: "Uncle Wiggily's Christmas",
				filePath: 'audiobooks/uncle-wiggily-story-book/11-uncle-wiggily-s-christmas.mp3',
				durationSeconds: 917,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-s-fourth-of-july',
				title: "Uncle Wiggily's Fourth of July",
				filePath: 'audiobooks/uncle-wiggily-story-book/12-uncle-wiggily-s-fourth-of-july.mp3',
				durationSeconds: 820,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-skates',
				title: 'Uncle Wiggily and the Skates',
				filePath: 'audiobooks/uncle-wiggily-story-book/13-uncle-wiggily-and-the-skates.mp3',
				durationSeconds: 696,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-goes-coasting',
				title: 'Uncle Wiggily Goes Coasting',
				filePath: 'audiobooks/uncle-wiggily-story-book/14-uncle-wiggily-goes-coasting.mp3',
				durationSeconds: 654,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-s-picnic',
				title: "Uncle Wiggily's Picnic",
				filePath: 'audiobooks/uncle-wiggily-story-book/15-uncle-wiggily-s-picnic.mp3',
				durationSeconds: 552,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-s-rain-storm',
				title: "Uncle Wiggily's Rain Storm",
				filePath: 'audiobooks/uncle-wiggily-story-book/16-uncle-wiggily-s-rain-storm.mp3',
				durationSeconds: 524,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-mumps',
				title: 'Uncle Wiggily and the Mumps',
				filePath: 'audiobooks/uncle-wiggily-story-book/17-uncle-wiggily-and-the-mumps.mp3',
				durationSeconds: 1003,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-measles',
				title: 'Uncle Wiggily and the Measles',
				filePath: 'audiobooks/uncle-wiggily-story-book/18-uncle-wiggily-and-the-measles.mp3',
				durationSeconds: 771,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-chicken-pox',
				title: 'Uncle Wiggily and the Chicken-Pox',
				filePath: 'audiobooks/uncle-wiggily-story-book/19-uncle-wiggily-and-the-chicken-pox.mp3',
				durationSeconds: 609,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-s-hallowe-en',
				title: "Uncle Wiggily's Hallowe'en",
				filePath: 'audiobooks/uncle-wiggily-story-book/20-uncle-wiggily-s-hallowe-en.mp3',
				durationSeconds: 591,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-poor-dog',
				title: 'Uncle Wiggily and the Poor Dog',
				filePath: 'audiobooks/uncle-wiggily-story-book/21-uncle-wiggily-and-the-poor-dog.mp3',
				durationSeconds: 507,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-rich-cat',
				title: 'Uncle Wiggily and the Rich Cat',
				filePath: 'audiobooks/uncle-wiggily-story-book/22-uncle-wiggily-and-the-rich-cat.mp3',
				durationSeconds: 658,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-horse',
				title: 'Uncle Wiggily and the Horse',
				filePath: 'audiobooks/uncle-wiggily-story-book/23-uncle-wiggily-and-the-horse.mp3',
				durationSeconds: 516,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-cow',
				title: 'Uncle Wiggily and the Cow',
				filePath: 'audiobooks/uncle-wiggily-story-book/24-uncle-wiggily-and-the-cow.mp3',
				durationSeconds: 542,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-camping-boys',
				title: 'Uncle Wiggily and the Camping Boys',
				filePath: 'audiobooks/uncle-wiggily-story-book/25-uncle-wiggily-and-the-camping-boys.mp3',
				durationSeconds: 743,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-birthday-cake',
				title: 'Uncle Wiggily and the Birthday Cake',
				filePath: 'audiobooks/uncle-wiggily-story-book/26-uncle-wiggily-and-the-birthday-cake.mp3',
				durationSeconds: 802,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-new-year-s-horn',
				title: "Uncle Wiggily and the New Year's Horn",
				filePath: 'audiobooks/uncle-wiggily-story-book/27-uncle-wiggily-and-the-new-year-s-horn.mp3',
				durationSeconds: 572,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-s-thanksgiving',
				title: "Uncle Wiggily's Thanksgiving",
				filePath: 'audiobooks/uncle-wiggily-story-book/28-uncle-wiggily-s-thanksgiving.mp3',
				durationSeconds: 577,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-at-the-circus',
				title: 'Uncle Wiggily at the Circus',
				filePath: 'audiobooks/uncle-wiggily-story-book/29-uncle-wiggily-at-the-circus.mp3',
				durationSeconds: 613,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-lion',
				title: 'Uncle Wiggily and the Lion',
				filePath: 'audiobooks/uncle-wiggily-story-book/30-uncle-wiggily-and-the-lion.mp3',
				durationSeconds: 632,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-tiger',
				title: 'Uncle Wiggily and the Tiger',
				filePath: 'audiobooks/uncle-wiggily-story-book/31-uncle-wiggily-and-the-tiger.mp3',
				durationSeconds: 501,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-elephant',
				title: 'Uncle Wiggily and the Elephant',
				filePath: 'audiobooks/uncle-wiggily-story-book/32-uncle-wiggily-and-the-elephant.mp3',
				durationSeconds: 525,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-camel',
				title: 'Uncle Wiggily and the Camel',
				filePath: 'audiobooks/uncle-wiggily-story-book/33-uncle-wiggily-and-the-camel.mp3',
				durationSeconds: 773,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-wild-rabbit',
				title: 'Uncle Wiggily and the Wild Rabbit',
				filePath: 'audiobooks/uncle-wiggily-story-book/34-uncle-wiggily-and-the-wild-rabbit.mp3',
				durationSeconds: 777,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-tame-squirrel',
				title: 'Uncle Wiggily and the Tame Squirrel',
				filePath: 'audiobooks/uncle-wiggily-story-book/35-uncle-wiggily-and-the-tame-squirrel.mp3',
				durationSeconds: 495,
			},
			{
				id: 'uncle-wiggily-story-book-uncle-wiggily-and-the-wolf',
				title: 'Uncle Wiggily and the Wolf',
				filePath: 'audiobooks/uncle-wiggily-story-book/36-uncle-wiggily-and-the-wolf.mp3',
				durationSeconds: 419,
			},
		],
	},
] as const satisfies readonly YotoAudiobookConfig[];
