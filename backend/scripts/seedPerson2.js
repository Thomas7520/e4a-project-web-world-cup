const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.join(__dirname, '../env') });

const competition = {
    name: 'FIFA World Cup 2026',
    year: 2026,
    hostCountries: 'Canada, Mexico, United States',
    startDate: '2026-06-11',
    endDate: '2026-07-19',
};

const stadiums = [
    ['Mexico City Stadium', 'Mexico City', 'Mexico', 87523],
    ['Estadio Guadalajara', 'Guadalajara', 'Mexico', 49850],
    ['Estadio Monterrey', 'Monterrey', 'Mexico', 53500],
    ['Toronto Stadium', 'Toronto', 'Canada', 45500],
    ['BC Place Vancouver', 'Vancouver', 'Canada', 54500],
    ['Seattle Stadium', 'Seattle', 'United States', 68740],
    ['San Francisco Bay Area Stadium', 'Santa Clara', 'United States', 68500],
    ['Los Angeles Stadium', 'Inglewood', 'United States', 70240],
    ['Dallas Stadium', 'Arlington', 'United States', 80000],
    ['Houston Stadium', 'Houston', 'United States', 72220],
    ['Kansas City Stadium', 'Kansas City', 'United States', 76416],
    ['Atlanta Stadium', 'Atlanta', 'United States', 71000],
    ['Miami Stadium', 'Miami Gardens', 'United States', 64767],
    ['Boston Stadium', 'Foxborough', 'United States', 65878],
    ['New York New Jersey Stadium', 'East Rutherford', 'United States', 82500],
    ['Philadelphia Stadium', 'Philadelphia', 'United States', 67594],
];

const teams = [
    { group: 'A', name: 'Mexico', code: 'MEX', iso: 'mx', confederation: 'CONCACAF', players: ['Guillermo Ochoa', 'Luis Malagon', 'Cesar Montes', 'Johan Vasquez', 'Edson Alvarez', 'Luis Chavez', 'Erick Sanchez', 'Hirving Lozano', 'Uriel Antuna', 'Santiago Gimenez', 'Raul Jimenez'] },
    { group: 'A', name: 'South Africa', code: 'RSA', iso: 'za', confederation: 'CAF', players: ['Ronwen Williams', 'Grant Kekana', 'Mothobi Mvala', 'Aubrey Modiba', 'Teboho Mokoena', 'Themba Zwane', 'Sphephelo Sithole', 'Percy Tau', 'Evidence Makgopa', 'Lyle Foster', 'Oswin Appollis'] },
    { group: 'A', name: 'Korea Republic', code: 'KOR', iso: 'kr', confederation: 'AFC', players: ['Kim Seung-gyu', 'Kim Min-jae', 'Kim Young-gwon', 'Seol Young-woo', 'Hwang In-beom', 'Lee Kang-in', 'Son Heung-min', 'Hwang Hee-chan', 'Cho Gue-sung', 'Lee Jae-sung', 'Oh Hyeon-gyu'] },
    { group: 'A', name: 'Czechia', code: 'CZE', iso: 'cz', confederation: 'UEFA', players: ['Jindrich Stanek', 'Tomas Holes', 'Vladimir Coufal', 'David Zima', 'Tomas Soucek', 'Antonin Barak', 'Lukas Provod', 'Adam Hlozek', 'Patrik Schick', 'Vaclav Cerny', 'Mojmir Chytil'] },
    { group: 'B', name: 'Canada', code: 'CAN', iso: 'ca', confederation: 'CONCACAF', players: ['Maxime Crepeau', 'Alistair Johnston', 'Moise Bombito', 'Kamal Miller', 'Alphonso Davies', 'Stephen Eustaquio', 'Ismael Kone', 'Tajon Buchanan', 'Jacob Shaffelburg', 'Jonathan David', 'Cyle Larin'] },
    { group: 'B', name: 'Bosnia and Herzegovina', code: 'BIH', iso: 'ba', confederation: 'UEFA', players: ['Nikola Vasilj', 'Sead Kolasinac', 'Anel Ahmedhodzic', 'Amar Dedic', 'Rade Krunic', 'Miralem Pjanic', 'Benjamin Tahirovic', 'Amer Gojak', 'Ermedin Demirovic', 'Edin Dzeko', 'Haris Tabakovic'] },
    { group: 'B', name: 'Qatar', code: 'QAT', iso: 'qa', confederation: 'AFC', players: ['Meshaal Barsham', 'Pedro Miguel', 'Tarek Salman', 'Bassam Al-Rawi', 'Abdelkarim Hassan', 'Assim Madibo', 'Mohammed Waad', 'Akram Afif', 'Hassan Al-Haydos', 'Almoez Ali', 'Boualem Khoukhi'] },
    { group: 'B', name: 'Switzerland', code: 'SUI', iso: 'ch', confederation: 'UEFA', players: ['Yann Sommer', 'Gregor Kobel', 'Manuel Akanji', 'Nico Elvedi', 'Granit Xhaka', 'Remo Freuler', 'Denis Zakaria', 'Dan Ndoye', 'Ruben Vargas', 'Breel Embolo', 'Xherdan Shaqiri'] },
    { group: 'C', name: 'Brazil', code: 'BRA', iso: 'br', confederation: 'CONMEBOL', players: ['Alisson', 'Ederson', 'Marquinhos', 'Eder Militao', 'Casemiro', 'Bruno Guimaraes', 'Lucas Paqueta', 'Vinicius Junior', 'Rodrygo', 'Raphinha', 'Endrick'] },
    { group: 'C', name: 'Morocco', code: 'MAR', iso: 'ma', confederation: 'CAF', players: ['Yassine Bounou', 'Achraf Hakimi', 'Noussair Mazraoui', 'Nayef Aguerd', 'Romain Saiss', 'Sofyan Amrabat', 'Azzedine Ounahi', 'Hakim Ziyech', 'Brahim Diaz', 'Youssef En-Nesyri', 'Amine Adli'] },
    { group: 'C', name: 'Haiti', code: 'HAI', iso: 'ht', confederation: 'CONCACAF', players: ['Johny Placide', 'Ricardo Ade', 'Jean-Kevin Duverne', 'Carlens Arcus', 'Danley Jean Jacques', 'Bryan Alceus', 'Derrick Etienne Jr', 'Fafa Picault', 'Duckens Nazon', 'Frantzdy Pierrot', 'Louicius Don Deedson'] },
    { group: 'C', name: 'Scotland', code: 'SCO', iso: 'gb', flag: 'gb-sct', confederation: 'UEFA', players: ['Angus Gunn', 'Andy Robertson', 'Kieran Tierney', 'Scott McKenna', 'Scott McTominay', 'John McGinn', 'Billy Gilmour', 'Callum McGregor', 'Ryan Christie', 'Che Adams', 'Lawrence Shankland'] },
    { group: 'D', name: 'United States', code: 'USA', iso: 'us', confederation: 'CONCACAF', players: ['Matt Turner', 'Sergino Dest', 'Antonee Robinson', 'Tim Ream', 'Tyler Adams', 'Weston McKennie', 'Yunus Musah', 'Christian Pulisic', 'Gio Reyna', 'Tim Weah', 'Folarin Balogun'] },
    { group: 'D', name: 'Paraguay', code: 'PAR', iso: 'py', confederation: 'CONMEBOL', players: ['Gatito Fernandez', 'Gustavo Gomez', 'Junior Alonso', 'Omar Alderete', 'Mathias Villasanti', 'Diego Gomez', 'Miguel Almiron', 'Julio Enciso', 'Ramon Sosa', 'Antonio Sanabria', 'Adam Bareiro'] },
    { group: 'D', name: 'Australia', code: 'AUS', iso: 'au', confederation: 'AFC', players: ['Mathew Ryan', 'Harry Souttar', 'Kye Rowles', 'Aziz Behich', "Aiden O'Neill", 'Jackson Irvine', 'Riley McGree', 'Ajdin Hrustic', 'Craig Goodwin', 'Mitchell Duke', 'Martin Boyle'] },
    { group: 'D', name: 'Turkiye', code: 'TUR', iso: 'tr', confederation: 'UEFA', players: ['Ugurcan Cakir', 'Merih Demiral', 'Caglar Soyuncu', 'Ferdi Kadioglu', 'Hakan Calhanoglu', 'Orkun Kokcu', 'Arda Guler', 'Kerem Akturkoglu', 'Kenan Yildiz', 'Baris Alper Yilmaz', 'Cenk Tosun'] },
    { group: 'E', name: 'Germany', code: 'GER', iso: 'de', confederation: 'UEFA', players: ['Manuel Neuer', 'Marc-Andre ter Stegen', 'Antonio Rudiger', 'Jonathan Tah', 'Joshua Kimmich', 'Robert Andrich', 'Florian Wirtz', 'Jamal Musiala', 'Leroy Sane', 'Kai Havertz', 'Niclas Fullkrug'] },
    { group: 'E', name: 'Curacao', code: 'CUW', iso: 'cw', confederation: 'CONCACAF', players: ['Eloy Room', 'Cuco Martina', 'Jurien Gaari', 'Roshon van Eijma', 'Vurnon Anita', 'Leandro Bacuna', 'Juninho Bacuna', 'Kenji Gorre', 'Jarchinio Antonia', 'Rangelo Janga', 'Gervane Kastaneer'] },
    { group: 'E', name: "Cote d'Ivoire", code: 'CIV', iso: 'ci', confederation: 'CAF', players: ['Yahia Fofana', 'Serge Aurier', 'Odilon Kossounou', 'Evan Ndicka', 'Wilfried Singo', 'Franck Kessie', 'Seko Fofana', 'Ibrahim Sangare', 'Simon Adingra', 'Sebastien Haller', 'Oumar Diakite'] },
    { group: 'E', name: 'Ecuador', code: 'ECU', iso: 'ec', confederation: 'CONMEBOL', players: ['Alexander Dominguez', 'Piero Hincapie', 'Willian Pacho', 'Pervis Estupinan', 'Moises Caicedo', 'Alan Franco', 'Kendry Paez', 'Gonzalo Plata', 'Jeremy Sarmiento', 'Enner Valencia', 'Kevin Rodriguez'] },
    { group: 'F', name: 'Netherlands', code: 'NED', iso: 'nl', confederation: 'UEFA', players: ['Bart Verbruggen', 'Virgil van Dijk', 'Matthijs de Ligt', 'Nathan Ake', 'Denzel Dumfries', 'Frenkie de Jong', 'Tijjani Reijnders', 'Xavi Simons', 'Cody Gakpo', 'Memphis Depay', 'Wout Weghorst'] },
    { group: 'F', name: 'Japan', code: 'JPN', iso: 'jp', confederation: 'AFC', players: ['Zion Suzuki', 'Ko Itakura', 'Takehiro Tomiyasu', 'Hiroki Ito', 'Wataru Endo', 'Hidemasa Morita', 'Takefusa Kubo', 'Kaoru Mitoma', 'Takumi Minamino', 'Daizen Maeda', 'Ayase Ueda'] },
    { group: 'F', name: 'Sweden', code: 'SWE', iso: 'se', confederation: 'UEFA', players: ['Robin Olsen', 'Victor Lindelof', 'Isak Hien', 'Ludwig Augustinsson', 'Jens Cajuste', 'Hugo Larsson', 'Emil Forsberg', 'Dejan Kulusevski', 'Anthony Elanga', 'Alexander Isak', 'Viktor Gyokeres'] },
    { group: 'F', name: 'Tunisia', code: 'TUN', iso: 'tn', confederation: 'CAF', players: ['Aymen Dahmen', 'Ali Abdi', 'Montassar Talbi', 'Yassine Meriah', 'Ellyes Skhiri', 'Aissa Laidouni', 'Hannibal Mejbri', 'Mohamed Ali Ben Romdhane', 'Youssef Msakni', 'Seifeddine Jaziri', 'Elias Achouri'] },
    { group: 'G', name: 'Belgium', code: 'BEL', iso: 'be', confederation: 'UEFA', players: ['Thibaut Courtois', 'Koen Casteels', 'Wout Faes', 'Arthur Theate', 'Youri Tielemans', 'Kevin De Bruyne', 'Amadou Onana', 'Jeremy Doku', 'Leandro Trossard', 'Romelu Lukaku', 'Lois Openda'] },
    { group: 'G', name: 'Egypt', code: 'EGY', iso: 'eg', confederation: 'CAF', players: ['Mohamed El Shenawy', 'Mohamed Abdelmonem', 'Ahmed Hegazi', 'Omar Kamal', 'Hamdi Fathi', 'Marwan Attia', 'Emam Ashour', 'Zizo', 'Trezeguet', 'Mohamed Salah', 'Mostafa Mohamed'] },
    { group: 'G', name: 'IR Iran', code: 'IRN', iso: 'ir', confederation: 'AFC', players: ['Alireza Beiranvand', 'Hossein Kanani', 'Shoja Khalilzadeh', 'Milad Mohammadi', 'Saeid Ezatolahi', 'Saman Ghoddos', 'Alireza Jahanbakhsh', 'Mehdi Ghayedi', 'Mehdi Taremi', 'Sardar Azmoun', 'Allahyar Sayyadmanesh'] },
    { group: 'G', name: 'New Zealand', code: 'NZL', iso: 'nz', confederation: 'OFC', players: ['Max Crocombe', 'Liberato Cacace', 'Nando Pijnaker', 'Michael Boxall', 'Joe Bell', 'Marko Stamenic', 'Sarpreet Singh', 'Matthew Garbett', 'Elijah Just', 'Chris Wood', 'Ben Waine'] },
    { group: 'H', name: 'Spain', code: 'ESP', iso: 'es', confederation: 'UEFA', players: ['Unai Simon', 'Dani Carvajal', 'Aymeric Laporte', 'Robin Le Normand', 'Alejandro Grimaldo', 'Rodri', 'Pedri', 'Gavi', 'Nico Williams', 'Lamine Yamal', 'Alvaro Morata'] },
    { group: 'H', name: 'Cabo Verde', code: 'CPV', iso: 'cv', confederation: 'CAF', players: ['Vozinha', 'Roberto Lopes', 'Logan Costa', 'Steven Moreira', 'Kevin Pina', 'Kenny Rocha Santos', 'Jamiro Monteiro', 'Ryan Mendes', 'Jovane Cabral', 'Dailon Livramento', 'Garry Rodrigues'] },
    { group: 'H', name: 'Saudi Arabia', code: 'KSA', iso: 'sa', confederation: 'AFC', players: ['Mohammed Al-Owais', 'Saud Abdulhamid', 'Ali Al-Bulaihi', 'Hassan Tambakti', 'Salman Al-Faraj', 'Mohamed Kanno', 'Abdulrahman Ghareeb', 'Salem Al-Dawsari', 'Firas Al-Buraikan', 'Saleh Al-Shehri', 'Nawaf Al-Aqidi'] },
    { group: 'H', name: 'Uruguay', code: 'URU', iso: 'uy', confederation: 'CONMEBOL', players: ['Sergio Rochet', 'Jose Maria Gimenez', 'Ronald Araujo', 'Mathias Olivera', 'Manuel Ugarte', 'Federico Valverde', 'Rodrigo Bentancur', 'Nicolas de la Cruz', 'Facundo Pellistri', 'Darwin Nunez', 'Luis Suarez'] },
    { group: 'I', name: 'France', code: 'FRA', iso: 'fr', confederation: 'UEFA', players: ['Mike Maignan', 'Jules Kounde', 'William Saliba', 'Dayot Upamecano', 'Theo Hernandez', 'Aurelien Tchouameni', 'Adrien Rabiot', 'Antoine Griezmann', 'Ousmane Dembele', 'Kylian Mbappe', 'Marcus Thuram'] },
    { group: 'I', name: 'Senegal', code: 'SEN', iso: 'sn', confederation: 'CAF', players: ['Edouard Mendy', 'Kalidou Koulibaly', 'Abdou Diallo', 'Ismail Jakobs', 'Idrissa Gueye', 'Nampalys Mendy', 'Pape Matar Sarr', 'Ismaila Sarr', 'Sadio Mane', 'Nicolas Jackson', 'Habib Diallo'] },
    { group: 'I', name: 'Iraq', code: 'IRQ', iso: 'iq', confederation: 'AFC', players: ['Jalal Hassan', 'Rebin Sulaka', 'Frans Putros', 'Ahmed Yahya', 'Amir Al-Ammari', 'Osama Rashid', 'Bashar Resan', 'Ibrahim Bayesh', 'Ali Jasim', 'Aymen Hussein', 'Ali Al-Hamadi'] },
    { group: 'I', name: 'Norway', code: 'NOR', iso: 'no', confederation: 'UEFA', players: ['Orjan Nyland', 'Leo Ostigard', 'Kristoffer Ajer', 'Julian Ryerson', 'Sander Berge', 'Fredrik Aursnes', 'Martin Odegaard', 'Oscar Bobb', 'Antonio Nusa', 'Alexander Sorloth', 'Erling Haaland'] },
    { group: 'J', name: 'Argentina', code: 'ARG', iso: 'ar', confederation: 'CONMEBOL', players: ['Emiliano Martinez', 'Cristian Romero', 'Nicolas Otamendi', 'Lisandro Martinez', 'Rodrigo De Paul', 'Enzo Fernandez', 'Alexis Mac Allister', 'Lionel Messi', 'Nicolas Gonzalez', 'Lautaro Martinez', 'Julian Alvarez'] },
    { group: 'J', name: 'Algeria', code: 'ALG', iso: 'dz', confederation: 'CAF', players: ['Anthony Mandrea', 'Ramy Bensebaini', 'Aissa Mandi', 'Rayan Ait-Nouri', 'Ismael Bennacer', 'Houssem Aouar', 'Ramiz Zerrouki', 'Riyad Mahrez', 'Said Benrahma', 'Amine Gouiri', 'Baghdad Bounedjah'] },
    { group: 'J', name: 'Austria', code: 'AUT', iso: 'at', confederation: 'UEFA', players: ['Patrick Pentz', 'Stefan Posch', 'Kevin Danso', 'David Alaba', 'Nicolas Seiwald', 'Konrad Laimer', 'Marcel Sabitzer', 'Christoph Baumgartner', 'Romano Schmid', 'Michael Gregoritsch', 'Marko Arnautovic'] },
    { group: 'J', name: 'Jordan', code: 'JOR', iso: 'jo', confederation: 'AFC', players: ['Yazeed Abulaila', 'Abdallah Nasib', 'Yazan Al-Arab', 'Salem Al-Ajalin', 'Nizar Al-Rashdan', 'Noor Al-Rawabdeh', 'Ibrahim Sadeh', 'Mahmoud Al-Mardi', 'Mousa Al-Taamari', 'Ali Olwan', 'Yazan Al-Naimat'] },
    { group: 'K', name: 'Portugal', code: 'POR', iso: 'pt', confederation: 'UEFA', players: ['Diogo Costa', 'Ruben Dias', 'Antonio Silva', 'Joao Cancelo', 'Nuno Mendes', 'Joao Palhinha', 'Bruno Fernandes', 'Bernardo Silva', 'Rafael Leao', 'Cristiano Ronaldo', 'Goncalo Ramos'] },
    { group: 'K', name: 'Congo DR', code: 'COD', iso: 'cd', confederation: 'CAF', players: ['Dimitry Bertaud', 'Chancel Mbemba', 'Axel Tuanzebe', 'Arthur Masuaku', 'Samuel Moutoussamy', 'Gael Kakuta', 'Theo Bongonda', 'Silas', 'Yoane Wissa', 'Cedric Bakambu', 'Fiston Mayele'] },
    { group: 'K', name: 'Uzbekistan', code: 'UZB', iso: 'uz', confederation: 'AFC', players: ['Utkir Yusupov', 'Abdukodir Khusanov', 'Umar Eshmurodov', 'Farrukh Sayfiyev', 'Odiljon Hamrobekov', 'Sherzod Nasrullaev', 'Abbosbek Fayzullaev', 'Jaloliddin Masharipov', 'Oston Urunov', 'Eldor Shomurodov', 'Igor Sergeev'] },
    { group: 'K', name: 'Colombia', code: 'COL', iso: 'co', confederation: 'CONMEBOL', players: ['Camilo Vargas', 'Davinson Sanchez', 'Yerry Mina', 'Daniel Munoz', 'Johan Mojica', 'Jefferson Lerma', 'Richard Rios', 'James Rodriguez', 'Jhon Arias', 'Luis Diaz', 'Jhon Duran'] },
    { group: 'L', name: 'England', code: 'ENG', iso: 'gb', flag: 'gb-eng', confederation: 'UEFA', players: ['Jordan Pickford', 'Kyle Walker', 'John Stones', 'Marc Guehi', 'Declan Rice', 'Jude Bellingham', 'Phil Foden', 'Bukayo Saka', 'Cole Palmer', 'Harry Kane', 'Marcus Rashford'] },
    { group: 'L', name: 'Croatia', code: 'CRO', iso: 'hr', confederation: 'UEFA', players: ['Dominik Livakovic', 'Josko Gvardiol', 'Josip Sutalo', 'Josip Stanisic', 'Luka Modric', 'Mateo Kovacic', 'Marcelo Brozovic', 'Lovro Majer', 'Ivan Perisic', 'Andrej Kramaric', 'Bruno Petkovic'] },
    { group: 'L', name: 'Ghana', code: 'GHA', iso: 'gh', confederation: 'CAF', players: ['Lawrence Ati-Zigi', 'Alexander Djiku', 'Mohammed Salisu', 'Gideon Mensah', 'Thomas Partey', 'Mohammed Kudus', 'Jordan Ayew', 'Ernest Nuamah', 'Kamaldeen Sulemana', 'Antoine Semenyo', 'Inaki Williams'] },
    { group: 'L', name: 'Panama', code: 'PAN', iso: 'pa', confederation: 'CONCACAF', players: ['Orlando Mosquera', 'Michael Murillo', 'Fidel Escobar', 'Andres Andrade', 'Anibal Godoy', 'Adalberto Carrasquilla', 'Cristian Martinez', 'Yoel Barcenas', 'Ismael Diaz', 'Jose Fajardo', 'Cecilio Waterman'] },
];

const fixtures = [
    ['2026-06-11', 'A', 'Mexico', 'South Africa', 'Mexico City Stadium'],
    ['2026-06-11', 'A', 'Korea Republic', 'Czechia', 'Estadio Guadalajara'],
    ['2026-06-12', 'B', 'Canada', 'Bosnia and Herzegovina', 'Toronto Stadium'],
    ['2026-06-12', 'D', 'United States', 'Paraguay', 'Los Angeles Stadium'],
    ['2026-06-13', 'C', 'Haiti', 'Scotland', 'Boston Stadium'],
    ['2026-06-13', 'D', 'Australia', 'Turkiye', 'BC Place Vancouver'],
    ['2026-06-13', 'C', 'Brazil', 'Morocco', 'New York New Jersey Stadium'],
    ['2026-06-13', 'B', 'Qatar', 'Switzerland', 'San Francisco Bay Area Stadium'],
    ['2026-06-14', 'E', "Cote d'Ivoire", 'Ecuador', 'Philadelphia Stadium'],
    ['2026-06-14', 'E', 'Germany', 'Curacao', 'Houston Stadium'],
    ['2026-06-14', 'F', 'Netherlands', 'Japan', 'Dallas Stadium'],
    ['2026-06-14', 'F', 'Sweden', 'Tunisia', 'Estadio Monterrey'],
    ['2026-06-15', 'H', 'Saudi Arabia', 'Uruguay', 'Miami Stadium'],
    ['2026-06-15', 'H', 'Spain', 'Cabo Verde', 'Atlanta Stadium'],
    ['2026-06-15', 'G', 'IR Iran', 'New Zealand', 'Los Angeles Stadium'],
    ['2026-06-15', 'G', 'Belgium', 'Egypt', 'Seattle Stadium'],
    ['2026-06-16', 'I', 'France', 'Senegal', 'New York New Jersey Stadium'],
    ['2026-06-16', 'I', 'Iraq', 'Norway', 'Boston Stadium'],
    ['2026-06-16', 'J', 'Argentina', 'Algeria', 'Kansas City Stadium'],
    ['2026-06-16', 'J', 'Austria', 'Jordan', 'San Francisco Bay Area Stadium'],
    ['2026-06-17', 'L', 'Ghana', 'Panama', 'Toronto Stadium'],
    ['2026-06-17', 'L', 'England', 'Croatia', 'Dallas Stadium'],
    ['2026-06-17', 'K', 'Portugal', 'Congo DR', 'Houston Stadium'],
    ['2026-06-17', 'K', 'Uzbekistan', 'Colombia', 'Mexico City Stadium'],
    ['2026-06-18', 'A', 'Czechia', 'South Africa', 'Atlanta Stadium'],
    ['2026-06-18', 'B', 'Switzerland', 'Bosnia and Herzegovina', 'Los Angeles Stadium'],
    ['2026-06-18', 'B', 'Canada', 'Qatar', 'BC Place Vancouver'],
    ['2026-06-18', 'A', 'Mexico', 'Korea Republic', 'Estadio Guadalajara'],
    ['2026-06-19', 'C', 'Brazil', 'Haiti', 'Philadelphia Stadium'],
    ['2026-06-19', 'C', 'Scotland', 'Morocco', 'Boston Stadium'],
    ['2026-06-19', 'D', 'Turkiye', 'Paraguay', 'San Francisco Bay Area Stadium'],
    ['2026-06-19', 'D', 'United States', 'Australia', 'Seattle Stadium'],
    ['2026-06-20', 'E', 'Germany', "Cote d'Ivoire", 'Toronto Stadium'],
    ['2026-06-20', 'E', 'Ecuador', 'Curacao', 'Kansas City Stadium'],
    ['2026-06-20', 'F', 'Netherlands', 'Sweden', 'Houston Stadium'],
    ['2026-06-20', 'F', 'Tunisia', 'Japan', 'Estadio Monterrey'],
    ['2026-06-21', 'H', 'Uruguay', 'Cabo Verde', 'Miami Stadium'],
    ['2026-06-21', 'H', 'Spain', 'Saudi Arabia', 'Atlanta Stadium'],
    ['2026-06-21', 'G', 'Belgium', 'IR Iran', 'Los Angeles Stadium'],
    ['2026-06-21', 'G', 'New Zealand', 'Egypt', 'BC Place Vancouver'],
    ['2026-06-22', 'I', 'Norway', 'Senegal', 'New York New Jersey Stadium'],
    ['2026-06-22', 'I', 'France', 'Iraq', 'Philadelphia Stadium'],
    ['2026-06-22', 'J', 'Argentina', 'Austria', 'Dallas Stadium'],
    ['2026-06-22', 'J', 'Jordan', 'Algeria', 'San Francisco Bay Area Stadium'],
    ['2026-06-23', 'L', 'England', 'Ghana', 'Boston Stadium'],
    ['2026-06-23', 'L', 'Panama', 'Croatia', 'Toronto Stadium'],
    ['2026-06-23', 'K', 'Portugal', 'Uzbekistan', 'Houston Stadium'],
    ['2026-06-23', 'K', 'Colombia', 'Congo DR', 'Estadio Guadalajara'],
    ['2026-06-24', 'C', 'Scotland', 'Brazil', 'Miami Stadium'],
    ['2026-06-24', 'C', 'Morocco', 'Haiti', 'Atlanta Stadium'],
    ['2026-06-24', 'B', 'Switzerland', 'Canada', 'BC Place Vancouver'],
    ['2026-06-24', 'B', 'Bosnia and Herzegovina', 'Qatar', 'Seattle Stadium'],
    ['2026-06-24', 'A', 'Czechia', 'Mexico', 'Mexico City Stadium'],
    ['2026-06-24', 'A', 'South Africa', 'Korea Republic', 'Estadio Monterrey'],
    ['2026-06-25', 'E', 'Curacao', "Cote d'Ivoire", 'Philadelphia Stadium'],
    ['2026-06-25', 'E', 'Ecuador', 'Germany', 'New York New Jersey Stadium'],
    ['2026-06-25', 'F', 'Japan', 'Sweden', 'Dallas Stadium'],
    ['2026-06-25', 'F', 'Tunisia', 'Netherlands', 'Kansas City Stadium'],
    ['2026-06-25', 'D', 'Turkiye', 'United States', 'Los Angeles Stadium'],
    ['2026-06-25', 'D', 'Paraguay', 'Australia', 'San Francisco Bay Area Stadium'],
    ['2026-06-26', 'I', 'Norway', 'France', 'Boston Stadium'],
    ['2026-06-26', 'I', 'Senegal', 'Iraq', 'Toronto Stadium'],
    ['2026-06-26', 'G', 'Egypt', 'IR Iran', 'Seattle Stadium'],
    ['2026-06-26', 'G', 'New Zealand', 'Belgium', 'BC Place Vancouver'],
    ['2026-06-26', 'H', 'Cabo Verde', 'Saudi Arabia', 'Houston Stadium'],
    ['2026-06-26', 'H', 'Uruguay', 'Spain', 'Estadio Guadalajara'],
    ['2026-06-27', 'L', 'Panama', 'England', 'New York New Jersey Stadium'],
    ['2026-06-27', 'L', 'Croatia', 'Ghana', 'Philadelphia Stadium'],
    ['2026-06-27', 'J', 'Algeria', 'Austria', 'Kansas City Stadium'],
    ['2026-06-27', 'J', 'Jordan', 'Argentina', 'Dallas Stadium'],
    ['2026-06-27', 'K', 'Colombia', 'Portugal', 'Miami Stadium'],
    ['2026-06-27', 'K', 'Congo DR', 'Uzbekistan', 'Atlanta Stadium'],
];

const referees = [
    ['Szymon Marciniak', 'Poland'],
    ['Stephanie Frappart', 'France'],
    ['Michael Oliver', 'England'],
    ['Cesar Arturo Ramos', 'Mexico'],
    ['Wilton Sampaio', 'Brazil'],
    ['Ismail Elfath', 'United States'],
    ['Victor Gomes', 'South Africa'],
    ['Facundo Tello', 'Argentina'],
    ['Danny Makkelie', 'Netherlands'],
    ['Claudia Umpierrez', 'Uruguay'],
    ['Abdulrahman Al-Jassim', 'Qatar'],
    ['Yoshimi Yamashita', 'Japan'],
];

const getPosition = (index) => {
    if (index === 0) return 'goalkeeper';
    if (index <= 4) return 'defender';
    if (index <= 7) return 'midfielder';
    return 'forward';
};

const getKickoff = (date, indexForDate, matchesForDate) => {
    const slotsByCount = {
        2: ['19:00:00', '22:00:00'],
        4: ['12:00:00', '15:00:00', '18:00:00', '21:00:00'],
        6: ['15:00:00', '15:00:00', '19:00:00', '19:00:00', '22:00:00', '22:00:00'],
    };
    const slots = slotsByCount[matchesForDate] || ['18:00:00'];
    return `${date} ${slots[indexForDate] || slots[0]}`;
};

const flagUrl = (team) => `https://flagcdn.com/w80/${team.flag || team.iso}.png`;

async function initConnection() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true,
    });
}

async function seed() {
    const connection = await initConnection();

    try {
        await connection.beginTransaction();

        // Remove any existing World Cup competitions so the app keeps a single dataset
        await connection.query('DELETE FROM competitions');

        await connection.query(
            `INSERT INTO competitions (name, year, host_countries, start_date, end_date)
             VALUES (?, ?, ?, ?, ?)`,
            [competition.name, competition.year, competition.hostCountries, competition.startDate, competition.endDate]
        );

        const [[competitionRow]] = await connection.query(
            'SELECT competition_id FROM competitions WHERE name = ? AND year = ?',
            [competition.name, competition.year]
        );

        const competitionId = competitionRow.competition_id;
        const groupIds = new Map();
        for (const name of 'ABCDEFGHIJKL'.split('')) {
            await connection.query(
                `INSERT INTO groups_pool (competition_id, name)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE name = VALUES(name)`,
                [competitionId, name]
            );
            const [[groupRow]] = await connection.query(
                'SELECT group_id FROM groups_pool WHERE competition_id = ? AND name = ?',
                [competitionId, name]
            );
            groupIds.set(name, groupRow.group_id);
        }

        const stadiumIds = new Map();
        for (const [name, city, country, capacity] of stadiums) {
            await connection.query(
                `INSERT INTO stadiums (name, city, country, capacity)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    city = VALUES(city),
                    country = VALUES(country),
                    capacity = VALUES(capacity)`,
                [name, city, country, capacity]
            );
            const [[stadiumRow]] = await connection.query('SELECT stadium_id FROM stadiums WHERE name = ?', [name]);
            stadiumIds.set(name, stadiumRow.stadium_id);
        }

        const teamIds = new Map();
        for (const team of teams) {
            await connection.query(
                `INSERT INTO teams (competition_id, group_id, name, fifa_code, iso_code, confederation, coach, flag_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    competition_id = VALUES(competition_id),
                    group_id = VALUES(group_id),
                    name = VALUES(name),
                    iso_code = VALUES(iso_code),
                    confederation = VALUES(confederation),
                    flag_url = VALUES(flag_url)`,
                [
                    competitionId,
                    groupIds.get(team.group),
                    team.name,
                    team.code,
                    team.iso.toUpperCase().slice(0, 2),
                    team.confederation,
                    null,
                    flagUrl(team),
                ]
            );
            const [[teamRow]] = await connection.query('SELECT team_id FROM teams WHERE fifa_code = ?', [team.code]);
            teamIds.set(team.name, teamRow.team_id);

            for (const [index, fullName] of team.players.entries()) {
                await connection.query(
                    `INSERT INTO players (team_id, full_name, position, shirt_number, club)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        full_name = VALUES(full_name),
                        position = VALUES(position),
                        club = VALUES(club)`,
                    [teamRow.team_id, fullName, getPosition(index), index + 1, null]
                );
            }
        }

        const refereeIds = [];
        for (const [fullName, nationality] of referees) {
            await connection.query(
                `INSERT INTO referees (full_name, nationality)
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE nationality = VALUES(nationality)`,
                [fullName, nationality]
            );
            const [[refereeRow]] = await connection.query('SELECT referee_id FROM referees WHERE full_name = ?', [fullName]);
            refereeIds.push(refereeRow.referee_id);
        }

        const matchesByDate = fixtures.reduce((counts, [date]) => {
            counts.set(date, (counts.get(date) || 0) + 1);
            return counts;
        }, new Map());
        const dateIndexes = new Map();

        for (const [index, [date, groupName, homeName, awayName, stadiumName]] of fixtures.entries()) {
            const matchNumber = index + 1;
            const dateIndex = dateIndexes.get(date) || 0;
            const kickoffAt = getKickoff(date, dateIndex, matchesByDate.get(date));
            dateIndexes.set(date, dateIndex + 1);

            await connection.query(
                `INSERT INTO matches (
                    competition_id,
                    group_id,
                    home_team_id,
                    away_team_id,
                    stadium_id,
                    match_number,
                    stage,
                    status,
                    kickoff_at
                 )
                 VALUES (?, ?, ?, ?, ?, ?, 'group', 'scheduled', ?)
                 ON DUPLICATE KEY UPDATE
                    competition_id = VALUES(competition_id),
                    group_id = VALUES(group_id),
                    home_team_id = VALUES(home_team_id),
                    away_team_id = VALUES(away_team_id),
                    stadium_id = VALUES(stadium_id),
                    stage = VALUES(stage),
                    kickoff_at = VALUES(kickoff_at)`,
                [
                    competitionId,
                    groupIds.get(groupName),
                    teamIds.get(homeName),
                    teamIds.get(awayName),
                    stadiumIds.get(stadiumName),
                    matchNumber,
                    kickoffAt,
                ]
            );

            const [[matchRow]] = await connection.query('SELECT match_id FROM matches WHERE match_number = ?', [matchNumber]);
            const refereeId = refereeIds[index % refereeIds.length];
            await connection.query(
                `INSERT INTO match_referees (match_id, referee_id, role)
                 VALUES (?, ?, 'main')
                 ON DUPLICATE KEY UPDATE referee_id = VALUES(referee_id)`,
                [matchRow.match_id, refereeId]
            );
        }

        await connection.commit();
        console.log('Seed Personne 2 termine avec succes');
        console.log(`Competition: ${competition.name}`);
        console.log(`Equipes: ${teams.length}, matchs de groupes: ${fixtures.length}, stades: ${stadiums.length}`);
    } catch (error) {
        await connection.rollback();
        console.error('Erreur seed Personne 2:', error.message);
        process.exitCode = 1;
    } finally {
        await connection.end();
    }
}

seed();
