const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

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

const teams = [
    // Group A
    { group: 'A', name: 'Mexico', code: 'MEX', iso: 'mx', confederation: 'CONCACAF' },
    { group: 'A', name: 'South Africa', code: 'RSA', iso: 'za', confederation: 'CAF' },
    { group: 'A', name: 'South Korea', code: 'KOR', iso: 'kr', confederation: 'AFC' },
    { group: 'A', name: 'Czech Republic', code: 'CZE', iso: 'cz', confederation: 'UEFA' },
    // Group B
    { group: 'B', name: 'Canada', code: 'CAN', iso: 'ca', confederation: 'CONCACAF' },
    { group: 'B', name: 'Bosnia and Herzegovina', code: 'BIH', iso: 'ba', confederation: 'UEFA' },
    { group: 'B', name: 'Qatar', code: 'QAT', iso: 'qa', confederation: 'AFC' },
    { group: 'B', name: 'Switzerland', code: 'SUI', iso: 'ch', confederation: 'UEFA' },
    // Group C
    { group: 'C', name: 'Brazil', code: 'BRA', iso: 'br', confederation: 'CONMEBOL' },
    { group: 'C', name: 'Morocco', code: 'MAR', iso: 'ma', confederation: 'CAF' },
    { group: 'C', name: 'Haiti', code: 'HAI', iso: 'ht', confederation: 'CONCACAF' },
    { group: 'C', name: 'Scotland', code: 'SCO', iso: 'gb', confederation: 'UEFA' },
    // Group D
    { group: 'D', name: 'United States', code: 'USA', iso: 'us', confederation: 'CONCACAF' },
    { group: 'D', name: 'Paraguay', code: 'PAR', iso: 'py', confederation: 'CONMEBOL' },
    { group: 'D', name: 'Australia', code: 'AUS', iso: 'au', confederation: 'AFC' },
    { group: 'D', name: 'Türkiye', code: 'TUR', iso: 'tr', confederation: 'UEFA' },
    // Group E
    { group: 'E', name: 'Germany', code: 'GER', iso: 'de', confederation: 'UEFA' },
    { group: 'E', name: 'Curaçao', code: 'CUW', iso: 'cw', confederation: 'CONCACAF' },
    { group: 'E', name: "Ivory Coast", code: 'CIV', iso: 'ci', confederation: 'CAF' },
    { group: 'E', name: 'Ecuador', code: 'ECU', iso: 'ec', confederation: 'CONMEBOL' },
    // Group F
    { group: 'F', name: 'Netherlands', code: 'NED', iso: 'nl', confederation: 'UEFA' },
    { group: 'F', name: 'Japan', code: 'JPN', iso: 'jp', confederation: 'AFC' },
    { group: 'F', name: 'Sweden', code: 'SWE', iso: 'se', confederation: 'UEFA' },
    { group: 'F', name: 'Tunisia', code: 'TUN', iso: 'tn', confederation: 'CAF' },
    // Group G
    { group: 'G', name: 'Belgium', code: 'BEL', iso: 'be', confederation: 'UEFA' },
    { group: 'G', name: 'Egypt', code: 'EGY', iso: 'eg', confederation: 'CAF' },
    { group: 'G', name: 'Iran', code: 'IRN', iso: 'ir', confederation: 'AFC' },
    { group: 'G', name: 'New Zealand', code: 'NZL', iso: 'nz', confederation: 'OFC' },
    // Group H
    { group: 'H', name: 'Spain', code: 'ESP', iso: 'es', confederation: 'UEFA' },
    { group: 'H', name: 'Cape Verde', code: 'CPV', iso: 'cv', confederation: 'CAF' },
    { group: 'H', name: 'Saudi Arabia', code: 'KSA', iso: 'sa', confederation: 'AFC' },
    { group: 'H', name: 'Uruguay', code: 'URU', iso: 'uy', confederation: 'CONMEBOL' },
    // Group I
    { group: 'I', name: 'France', code: 'FRA', iso: 'fr', confederation: 'UEFA' },
    { group: 'I', name: 'Senegal', code: 'SEN', iso: 'sn', confederation: 'CAF' },
    { group: 'I', name: 'Iraq', code: 'IRQ', iso: 'iq', confederation: 'AFC' },
    { group: 'I', name: 'Norway', code: 'NOR', iso: 'no', confederation: 'UEFA' },
    // Group J
    { group: 'J', name: 'Argentina', code: 'ARG', iso: 'ar', confederation: 'CONMEBOL' },
    { group: 'J', name: 'Algeria', code: 'ALG', iso: 'dz', confederation: 'CAF' },
    { group: 'J', name: 'Austria', code: 'AUT', iso: 'at', confederation: 'UEFA' },
    { group: 'J', name: 'Jordan', code: 'JOR', iso: 'jo', confederation: 'AFC' },
    // Group K
    { group: 'K', name: 'Portugal', code: 'POR', iso: 'pt', confederation: 'UEFA' },
    { group: 'K', name: 'DR Congo', code: 'COD', iso: 'cd', confederation: 'CAF' },
    { group: 'K', name: 'Uzbekistan', code: 'UZB', iso: 'uz', confederation: 'AFC' },
    { group: 'K', name: 'Colombia', code: 'COL', iso: 'co', confederation: 'CONMEBOL' },
    // Group L
    { group: 'L', name: 'England', code: 'ENG', iso: 'gb', confederation: 'UEFA' },
    { group: 'L', name: 'Croatia', code: 'CRO', iso: 'hr', confederation: 'UEFA' },
    { group: 'L', name: 'Ghana', code: 'GHA', iso: 'gh', confederation: 'CAF' },
    { group: 'L', name: 'Panama', code: 'PAN', iso: 'pa', confederation: 'CONCACAF' },
];

const playersByTeam = {
    Mexico: ['Guillermo Ochoa', 'Luis Malagon', 'Cesar Montes', 'Johan Vasquez', 'Edson Alvarez', 'Luis Chavez', 'Erick Sanchez', 'Hirving Lozano', 'Uriel Antuna', 'Santiago Gimenez', 'Raul Jimenez'],
    'South Africa': ['Ronwen Williams', 'Grant Kekana', 'Mothobi Mvala', 'Aubrey Modiba', 'Teboho Mokoena', 'Themba Zwane', 'Sphephelo Sithole', 'Percy Tau', 'Evidence Makgopa', 'Lyle Foster', 'Oswin Appollis'],
    'South Korea': ['Kim Seung-gyu', 'Kim Min-jae', 'Kim Young-gwon', 'Seol Young-woo', 'Hwang In-beom', 'Lee Kang-in', 'Son Heung-min', 'Hwang Hee-chan', 'Cho Gue-sung', 'Lee Jae-sung', 'Oh Hyeon-gyu'],
    'Czech Republic': ['Jindrich Stanek', 'Tomas Holes', 'Vladimir Coufal', 'David Zima', 'Tomas Soucek', 'Antonin Barak', 'Lukas Provod', 'Adam Hlozek', 'Patrik Schick', 'Vaclav Cerny', 'Mojmir Chytil'],
    Canada: ['Maxime Crepeau', 'Alistair Johnston', 'Moise Bombito', 'Kamal Miller', 'Alphonso Davies', 'Stephen Eustaquio', 'Ismael Kone', 'Tajon Buchanan', 'Jacob Shaffelburg', 'Jonathan David', 'Cyle Larin'],
    'Bosnia and Herzegovina': ['Nikola Vasilj', 'Sead Kolasinac', 'Anel Ahmedhodzic', 'Amar Dedic', 'Rade Krunic', 'Miralem Pjanic', 'Benjamin Tahirovic', 'Amer Gojak', 'Ermedin Demirovic', 'Edin Dzeko', 'Haris Tabakovic'],
    Qatar: ['Meshaal Barsham', 'Pedro Miguel', 'Tarek Salman', 'Bassam Al-Rawi', 'Abdelkarim Hassan', 'Assim Madibo', 'Mohammed Waad', 'Akram Afif', 'Hassan Al-Haydos', 'Almoez Ali', 'Boualem Khoukhi'],
    Switzerland: ['Yann Sommer', 'Gregor Kobel', 'Manuel Akanji', 'Nico Elvedi', 'Granit Xhaka', 'Remo Freuler', 'Denis Zakaria', 'Dan Ndoye', 'Ruben Vargas', 'Breel Embolo', 'Xherdan Shaqiri'],
    Brazil: ['Alisson', 'Ederson', 'Marquinhos', 'Eder Militao', 'Casemiro', 'Bruno Guimaraes', 'Lucas Paqueta', 'Vinicius Junior', 'Rodrygo', 'Raphinha', 'Endrick'],
    Morocco: ['Yassine Bounou', 'Achraf Hakimi', 'Noussair Mazraoui', 'Nayef Aguerd', 'Romain Saiss', 'Sofyan Amrabat', 'Azzedine Ounahi', 'Hakim Ziyech', 'Brahim Diaz', 'Youssef En-Nesyri', 'Amine Adli'],
    Haiti: ['Johny Placide', 'Ricardo Ade', 'Jean-Kevin Duverne', 'Carlens Arcus', 'Danley Jean Jacques', 'Bryan Alceus', 'Derrick Etienne Jr', 'Fafa Picault', 'Duckens Nazon', 'Frantzdy Pierrot', 'Louicius Don Deedson'],
    Scotland: ['Angus Gunn', 'Andy Robertson', 'Kieran Tierney', 'Scott McKenna', 'Scott McTominay', 'John McGinn', 'Billy Gilmour', 'Callum McGregor', 'Ryan Christie', 'Che Adams', 'Lawrence Shankland'],
    'United States': ['Matt Turner', 'Sergino Dest', 'Antonee Robinson', 'Tim Ream', 'Tyler Adams', 'Weston McKennie', 'Yunus Musah', 'Christian Pulisic', 'Gio Reyna', 'Tim Weah', 'Folarin Balogun'],
    Paraguay: ['Gatito Fernandez', 'Gustavo Gomez', 'Junior Alonso', 'Omar Alderete', 'Mathias Villasanti', 'Diego Gomez', 'Miguel Almiron', 'Julio Enciso', 'Ramon Sosa', 'Antonio Sanabria', 'Adam Bareiro'],
    Australia: ['Mathew Ryan', 'Harry Souttar', 'Kye Rowles', 'Aziz Behich', "Aiden O'Neill", 'Jackson Irvine', 'Riley McGree', 'Ajdin Hrustic', 'Craig Goodwin', 'Mitchell Duke', 'Martin Boyle'],
    Türkiye: ['Ugurcan Cakir', 'Merih Demiral', 'Caglar Soyuncu', 'Ferdi Kadioglu', 'Hakan Calhanoglu', 'Orkun Kokcu', 'Arda Guler', 'Kerem Akturkoglu', 'Kenan Yildiz', 'Baris Alper Yilmaz', 'Cenk Tosun'],
    Germany: ['Manuel Neuer', 'Marc-Andre ter Stegen', 'Antonio Rudiger', 'Jonathan Tah', 'Joshua Kimmich', 'Robert Andrich', 'Florian Wirtz', 'Jamal Musiala', 'Leroy Sane', 'Kai Havertz', 'Niclas Fullkrug'],
    Curaçao: ['Eloy Room', 'Cuco Martina', 'Jurien Gaari', 'Roshon van Eijma', 'Vurnon Anita', 'Leandro Bacuna', 'Juninho Bacuna', 'Kenji Gorre', 'Jarchinio Antonia', 'Rangelo Janga', 'Gervane Kastaneer'],
    'Ivory Coast': ['Yahia Fofana', 'Serge Aurier', 'Odilon Kossounou', 'Evan Ndicka', 'Wilfried Singo', 'Franck Kessie', 'Seko Fofana', 'Ibrahim Sangare', 'Simon Adingra', 'Sebastien Haller', 'Oumar Diakite'],
    Ecuador: ['Alexander Dominguez', 'Piero Hincapie', 'Willian Pacho', 'Pervis Estupinan', 'Moises Caicedo', 'Alan Franco', 'Kendry Paez', 'Gonzalo Plata', 'Jeremy Sarmiento', 'Enner Valencia', 'Kevin Rodriguez'],
    Netherlands: ['Bart Verbruggen', 'Virgil van Dijk', 'Matthijs de Ligt', 'Nathan Ake', 'Denzel Dumfries', 'Frenkie de Jong', 'Tijjani Reijnders', 'Xavi Simons', 'Cody Gakpo', 'Memphis Depay', 'Wout Weghorst'],
    Japan: ['Zion Suzuki', 'Ko Itakura', 'Takehiro Tomiyasu', 'Hiroki Ito', 'Wataru Endo', 'Hidemasa Morita', 'Takefusa Kubo', 'Kaoru Mitoma', 'Takumi Minamino', 'Daizen Maeda', 'Ayase Ueda'],
    Sweden: ['Robin Olsen', 'Victor Lindelof', 'Isak Hien', 'Ludwig Augustinsson', 'Jens Cajuste', 'Hugo Larsson', 'Emil Forsberg', 'Dejan Kulusevski', 'Anthony Elanga', 'Alexander Isak', 'Viktor Gyokeres'],
    Tunisia: ['Aymen Dahmen', 'Ali Abdi', 'Montassar Talbi', 'Yassine Meriah', 'Ellyes Skhiri', 'Aissa Laidouni', 'Hannibal Mejbri', 'Mohamed Ali Ben Romdhane', 'Youssef Msakni', 'Seifeddine Jaziri', 'Elias Achouri'],
    Belgium: ['Thibaut Courtois', 'Koen Casteels', 'Wout Faes', 'Arthur Theate', 'Youri Tielemans', 'Kevin De Bruyne', 'Amadou Onana', 'Jeremy Doku', 'Leandro Trossard', 'Romelu Lukaku', 'Lois Openda'],
    Egypt: ['Mohamed El Shenawy', 'Mohamed Abdelmonem', 'Ahmed Hegazi', 'Omar Kamal', 'Hamdi Fathi', 'Marwan Attia', 'Emam Ashour', 'Zizo', 'Trezeguet', 'Mohamed Salah', 'Mostafa Mohamed'],
    Iran: ['Alireza Beiranvand', 'Hossein Kanani', 'Shoja Khalilzadeh', 'Milad Mohammadi', 'Saeid Ezatolahi', 'Saman Ghoddos', 'Alireza Jahanbakhsh', 'Mehdi Ghayedi', 'Mehdi Taremi', 'Sardar Azmoun', 'Allahyar Sayyadmanesh'],
    'New Zealand': ['Max Crocombe', 'Liberato Cacace', 'Nando Pijnaker', 'Michael Boxall', 'Joe Bell', 'Marko Stamenic', 'Sarpreet Singh', 'Matthew Garbett', 'Elijah Just', 'Chris Wood', 'Ben Waine'],
    Spain: ['Unai Simon', 'Dani Carvajal', 'Aymeric Laporte', 'Robin Le Normand', 'Alejandro Grimaldo', 'Rodri', 'Pedri', 'Gavi', 'Nico Williams', 'Lamine Yamal', 'Alvaro Morata'],
    'Cape Verde': ['Vozinha', 'Roberto Lopes', 'Logan Costa', 'Steven Moreira', 'Kevin Pina', 'Kenny Rocha Santos', 'Jamiro Monteiro', 'Ryan Mendes', 'Jovane Cabral', 'Dailon Livramento', 'Garry Rodrigues'],
    'Saudi Arabia': ['Mohammed Al-Owais', 'Saud Abdulhamid', 'Ali Al-Bulaihi', 'Hassan Tambakti', 'Salman Al-Faraj', 'Mohamed Kanno', 'Abdulrahman Ghareeb', 'Salem Al-Dawsari', 'Firas Al-Buraikan', 'Saleh Al-Shehri', 'Nawaf Al-Aqidi'],
    Uruguay: ['Sergio Rochet', 'Jose Maria Gimenez', 'Ronald Araujo', 'Mathias Olivera', 'Manuel Ugarte', 'Federico Valverde', 'Rodrigo Bentancur', 'Nicolas de la Cruz', 'Facundo Pellistri', 'Darwin Nunez', 'Luis Suarez'],
    France: ['Mike Maignan', 'Jules Kounde', 'William Saliba', 'Dayot Upamecano', 'Theo Hernandez', 'Aurelien Tchouameni', 'Adrien Rabiot', 'Antoine Griezmann', 'Ousmane Dembele', 'Kylian Mbappe', 'Marcus Thuram'],
    Senegal: ['Edouard Mendy', 'Kalidou Koulibaly', 'Abdou Diallo', 'Ismail Jakobs', 'Idrissa Gueye', 'Nampalys Mendy', 'Pape Matar Sarr', 'Ismaila Sarr', 'Sadio Mane', 'Nicolas Jackson', 'Habib Diallo'],
    Iraq: ['Jalal Hassan', 'Rebin Sulaka', 'Frans Putros', 'Ahmed Yahya', 'Amir Al-Ammari', 'Osama Rashid', 'Bashar Resan', 'Ibrahim Bayesh', 'Ali Jasim', 'Aymen Hussein', 'Ali Al-Hamadi'],
    Norway: ['Orjan Nyland', 'Leo Ostigard', 'Kristoffer Ajer', 'Julian Ryerson', 'Sander Berge', 'Fredrik Aursnes', 'Martin Odegaard', 'Oscar Bobb', 'Antonio Nusa', 'Alexander Sorloth', 'Erling Haaland'],
    Argentina: ['Emiliano Martinez', 'Cristian Romero', 'Nicolas Otamendi', 'Lisandro Martinez', 'Rodrigo De Paul', 'Enzo Fernandez', 'Alexis Mac Allister', 'Lionel Messi', 'Nicolas Gonzalez', 'Lautaro Martinez', 'Julian Alvarez'],
    Algeria: ['Anthony Mandrea', 'Ramy Bensebaini', 'Aissa Mandi', 'Rayan Ait-Nouri', 'Ismael Bennacer', 'Houssem Aouar', 'Ramiz Zerrouki', 'Riyad Mahrez', 'Said Benrahma', 'Amine Gouiri', 'Baghdad Bounedjah'],
    Austria: ['Patrick Pentz', 'Stefan Posch', 'Kevin Danso', 'David Alaba', 'Nicolas Seiwald', 'Konrad Laimer', 'Marcel Sabitzer', 'Christoph Baumgartner', 'Romano Schmid', 'Michael Gregoritsch', 'Marko Arnautovic'],
    Jordan: ['Yazeed Abulaila', 'Abdallah Nasib', 'Yazan Al-Arab', 'Salem Al-Ajalin', 'Nizar Al-Rashdan', 'Noor Al-Rawabdeh', 'Ibrahim Sadeh', 'Mahmoud Al-Mardi', 'Mousa Al-Taamari', 'Ali Olwan', 'Yazan Al-Naimat'],
    Portugal: ['Diogo Costa', 'Ruben Dias', 'Antonio Silva', 'Joao Cancelo', 'Nuno Mendes', 'Joao Palhinha', 'Bruno Fernandes', 'Bernardo Silva', 'Rafael Leao', 'Cristiano Ronaldo', 'Goncalo Ramos'],
    'DR Congo': ['Dimitry Bertaud', 'Chancel Mbemba', 'Axel Tuanzebe', 'Arthur Masuaku', 'Samuel Moutoussamy', 'Gael Kakuta', 'Theo Bongonda', 'Silas', 'Yoane Wissa', 'Cedric Bakambu', 'Fiston Mayele'],
    Uzbekistan: ['Utkir Yusupov', 'Abdukodir Khusanov', 'Umar Eshmurodov', 'Farrukh Sayfiyev', 'Odiljon Hamrobekov', 'Sherzod Nasrullaev', 'Abbosbek Fayzullaev', 'Jaloliddin Masharipov', 'Oston Urunov', 'Eldor Shomurodov', 'Igor Sergeev'],
    Colombia: ['Camilo Vargas', 'Davinson Sanchez', 'Yerry Mina', 'Daniel Munoz', 'Johan Mojica', 'Jefferson Lerma', 'Richard Rios', 'James Rodriguez', 'Jhon Arias', 'Luis Diaz', 'Jhon Duran'],
    England: ['Jordan Pickford', 'Kyle Walker', 'John Stones', 'Marc Guehi', 'Declan Rice', 'Jude Bellingham', 'Phil Foden', 'Bukayo Saka', 'Cole Palmer', 'Harry Kane', 'Marcus Rashford'],
    Croatia: ['Dominik Livakovic', 'Josko Gvardiol', 'Josip Sutalo', 'Josip Stanisic', 'Luka Modric', 'Mateo Kovacic', 'Marcelo Brozovic', 'Lovro Majer', 'Ivan Perisic', 'Andrej Kramaric', 'Bruno Petkovic'],
    Ghana: ['Lawrence Ati-Zigi', 'Alexander Djiku', 'Mohammed Salisu', 'Gideon Mensah', 'Thomas Partey', 'Mohammed Kudus', 'Jordan Ayew', 'Ernest Nuamah', 'Kamaldeen Sulemana', 'Antoine Semenyo', 'Inaki Williams'],
    Panama: ['Orlando Mosquera', 'Michael Murillo', 'Fidel Escobar', 'Andres Andrade', 'Anibal Godoy', 'Adalberto Carrasquilla', 'Cristian Martinez', 'Yoel Barcenas', 'Ismael Diaz', 'Jose Fajardo', 'Cecilio Waterman'],
};

// Simulated group fixtures (6 matches per group for groups A-L)
const groupFixtures = {
    A: [
        ['Mexico', 'South Africa', 2, 1],
        ['South Korea', 'Czech Republic', 1, 1],
        ['Mexico', 'South Korea', 2, 0],
        ['South Africa', 'Czech Republic', 0, 1],
        ['Mexico', 'Czech Republic', 1, 1],
        ['South Africa', 'South Korea', 1, 2],
    ],
    B: [
        ['Canada', 'Bosnia and Herzegovina', 1, 0],
        ['Qatar', 'Switzerland', 0, 2],
        ['Canada', 'Qatar', 2, 1],
        ['Bosnia and Herzegovina', 'Switzerland', 1, 2],
        ['Canada', 'Switzerland', 1, 1],
        ['Bosnia and Herzegovina', 'Qatar', 2, 0],
    ],
    C: [
        ['Brazil', 'Morocco', 2, 1],
        ['Haiti', 'Scotland', 0, 3],
        ['Brazil', 'Haiti', 3, 0],
        ['Morocco', 'Scotland', 1, 1],
        ['Brazil', 'Scotland', 2, 2],
        ['Morocco', 'Haiti', 2, 0],
    ],
    D: [
        ['United States', 'Paraguay', 1, 0],
        ['Australia', 'Türkiye', 0, 2],
        ['United States', 'Australia', 2, 1],
        ['Paraguay', 'Türkiye', 1, 1],
        ['United States', 'Türkiye', 1, 2],
        ['Paraguay', 'Australia', 2, 0],
    ],
    E: [
        ['Germany', 'Curaçao', 3, 0],
        ['Ivory Coast', 'Ecuador', 1, 2],
        ['Germany', 'Ivory Coast', 2, 1],
        ['Curaçao', 'Ecuador', 0, 2],
        ['Germany', 'Ecuador', 1, 1],
        ['Curaçao', 'Ivory Coast', 0, 3],
    ],
    F: [
        ['Netherlands', 'Japan', 2, 1],
        ['Sweden', 'Tunisia', 1, 0],
        ['Netherlands', 'Sweden', 1, 1],
        ['Japan', 'Tunisia', 2, 0],
        ['Netherlands', 'Tunisia', 3, 0],
        ['Japan', 'Sweden', 1, 2],
    ],
    G: [
        ['Belgium', 'Egypt', 2, 0],
        ['Iran', 'New Zealand', 1, 1],
        ['Belgium', 'Iran', 3, 1],
        ['Egypt', 'New Zealand', 0, 1],
        ['Belgium', 'New Zealand', 2, 1],
        ['Egypt', 'Iran', 1, 2],
    ],
    H: [
        ['Spain', 'Cape Verde', 3, 0],
        ['Saudi Arabia', 'Uruguay', 0, 2],
        ['Spain', 'Saudi Arabia', 2, 1],
        ['Cape Verde', 'Uruguay', 0, 2],
        ['Spain', 'Uruguay', 1, 1],
        ['Cape Verde', 'Saudi Arabia', 1, 0],
    ],
    I: [
        ['France', 'Senegal', 2, 1],
        ['Iraq', 'Norway', 0, 2],
        ['France', 'Iraq', 3, 0],
        ['Senegal', 'Norway', 1, 1],
        ['France', 'Norway', 1, 1],
        ['Senegal', 'Iraq', 2, 0],
    ],
    J: [
        ['Argentina', 'Algeria', 2, 0],
        ['Austria', 'Jordan', 1, 1],
        ['Argentina', 'Austria', 1, 1],
        ['Algeria', 'Jordan', 2, 0],
        ['Argentina', 'Jordan', 3, 0],
        ['Algeria', 'Austria', 0, 2],
    ],
    K: [
        ['Portugal', 'DR Congo', 2, 0],
        ['Uzbekistan', 'Colombia', 0, 1],
        ['Portugal', 'Uzbekistan', 1, 1],
        ['DR Congo', 'Colombia', 1, 2],
        ['Portugal', 'Colombia', 2, 1],
        ['DR Congo', 'Uzbekistan', 2, 0],
    ],
    L: [
        ['England', 'Croatia', 1, 1],
        ['Ghana', 'Panama', 2, 0],
        ['England', 'Ghana', 2, 0],
        ['Croatia', 'Panama', 1, 0],
        ['England', 'Panama', 3, 1],
        ['Croatia', 'Ghana', 1, 2],
    ],
};

// Create a bracket up to Quarterfinals (round_of_32 -> round_of_16 -> quarter_final)
const knockoutMatches = [
    // Round of 32 (16 matches)
    { stage: 'round_of_32', position: 1, home: 'Mexico', away: 'Curaçao', home_score: 3, away_score: 0 },
    { stage: 'round_of_32', position: 2, home: 'Brazil', away: 'Haiti', home_score: 2, away_score: 0 },
    { stage: 'round_of_32', position: 3, home: 'United States', away: 'Australia', home_score: 2, away_score: 1 },
    { stage: 'round_of_32', position: 4, home: 'Germany', away: 'Ecuador', home_score: 1, away_score: 1, winner: 'Germany' },
    { stage: 'round_of_32', position: 5, home: 'Netherlands', away: 'Tunisia', home_score: 3, away_score: 1 },
    { stage: 'round_of_32', position: 6, home: 'Belgium', away: 'New Zealand', home_score: 2, away_score: 0 },
    { stage: 'round_of_32', position: 7, home: 'Spain', away: 'Uruguay', home_score: 1, away_score: 0 },
    { stage: 'round_of_32', position: 8, home: 'France', away: 'Norway', home_score: 2, away_score: 1 },
    { stage: 'round_of_32', position: 9, home: 'Argentina', away: 'Jordan', home_score: 2, away_score: 0 },
    { stage: 'round_of_32', position: 10, home: 'Portugal', away: 'Colombia', home_score: 1, away_score: 2 },
    { stage: 'round_of_32', position: 11, home: 'England', away: 'Panama', home_score: 3, away_score: 0 },
    { stage: 'round_of_32', position: 12, home: 'Croatia', away: 'Ghana', home_score: 1, away_score: 2 },
    { stage: 'round_of_32', position: 13, home: 'Japan', away: 'Sweden', home_score: 1, away_score: 1, winner: 'Japan' },
    { stage: 'round_of_32', position: 14, home: 'Morocco', away: 'Scotland', home_score: 0, away_score: 1 },
    { stage: 'round_of_32', position: 15, home: 'Canada', away: 'Switzerland', home_score: 1, away_score: 2 },
    { stage: 'round_of_32', position: 16, home: 'Czech Republic', away: 'DR Congo', home_score: 2, away_score: 0 },
    // Round of 16 (8 matches) - winners from above (we pick plausible winners)
    { stage: 'round_of_16', position: 1, home: 'Mexico', away: 'Brazil', home_score: 1, away_score: 2 },
    { stage: 'round_of_16', position: 2, home: 'United States', away: 'Germany', home_score: 1, away_score: 1, winner: 'Germany' },
    { stage: 'round_of_16', position: 3, home: 'Netherlands', away: 'Belgium', home_score: 2, away_score: 1 },
    { stage: 'round_of_16', position: 4, home: 'Spain', away: 'France', home_score: 1, away_score: 3 },
    { stage: 'round_of_16', position: 5, home: 'Argentina', away: 'Colombia', home_score: 2, away_score: 1 },
    { stage: 'round_of_16', position: 6, home: 'England', away: 'Ghana', home_score: 2, away_score: 0 },
    { stage: 'round_of_16', position: 7, home: 'Japan', away: 'Scotland', home_score: 1, away_score: 0 },
    { stage: 'round_of_16', position: 8, home: 'Switzerland', away: 'Portugal', home_score: 0, away_score: 1 },
    // Quarterfinals (4 matches)
    { stage: 'quarter_final', position: 1, home: 'Brazil', away: 'United States', home_score: 2, away_score: 1 },
    { stage: 'quarter_final', position: 2, home: 'Netherlands', away: 'France', home_score: 1, away_score: 2 },
    { stage: 'quarter_final', position: 3, home: 'Argentina', away: 'England', home_score: 2, away_score: 2, winner: 'Argentina' },
    { stage: 'quarter_final', position: 4, home: 'Japan', away: 'Portugal', home_score: 0, away_score: 1 },
];

const getPosition = (index) => {
    if (index === 0) return 'goalkeeper';
    if (index <= 4) return 'defender';
    if (index <= 7) return 'midfielder';
    return 'forward';
};

const buildEventsForMatch = (matchNumber, home, away, homeScore, awayScore) => {
    const goalPlayerIndexes = [9, 10, 8, 7, 6, 5];
    const assistPlayerIndexes = [7, 6, 5, 8, 4, 10];
    const homeGoalMinutes = [12, 34, 57, 76, 88, 90];
    const awayGoalMinutes = [18, 41, 63, 81, 89, 90];
    const generatedEvents = [];

    const addGoals = (team, goals, minutes) => {
        for (let index = 0; index < goals; index++) {
            const scorerIndex = goalPlayerIndexes[(matchNumber + index) % goalPlayerIndexes.length];
            const assistIndex = assistPlayerIndexes[(matchNumber + index + 1) % assistPlayerIndexes.length];
            const minute = minutes[index % minutes.length];

            generatedEvents.push({
                matchNumber,
                team,
                playerIndex: scorerIndex,
                event_type: 'goal',
                minute,
                description: `Goal for ${team}`,
            });

            if (assistIndex !== scorerIndex) {
                generatedEvents.push({
                    matchNumber,
                    team,
                    playerIndex: assistIndex,
                    event_type: 'assist',
                    minute,
                    description: `Assist for ${team}`,
                });
            }
        }
    };

    addGoals(home, homeScore, homeGoalMinutes);
    addGoals(away, awayScore, awayGoalMinutes);

    if (matchNumber % 2 === 0) {
        generatedEvents.push({
            matchNumber,
            team: home,
            playerIndex: 3,
            event_type: 'yellow_card',
            minute: 66,
            description: `Yellow card for ${home}`,
        });
    }

    if (matchNumber % 3 === 0) {
        generatedEvents.push({
            matchNumber,
            team: away,
            playerIndex: 2,
            event_type: 'yellow_card',
            minute: 72,
            description: `Yellow card for ${away}`,
        });
    }

    if (matchNumber % 17 === 0) {
        generatedEvents.push({
            matchNumber,
            team: away,
            playerIndex: 4,
            event_type: 'red_card',
            minute: 84,
            description: `Red card for ${away}`,
        });
    }

    return generatedEvents.sort((a, b) => a.minute - b.minute);
};

const flagUrl = (team) => `https://flagcdn.com/w80/${team.iso}.png`;

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

        await connection.query(
            `INSERT INTO competitions (name, year, host_countries, start_date, end_date)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                host_countries = VALUES(host_countries),
                start_date = VALUES(start_date),
                end_date = VALUES(end_date)`,
            [competition.name, competition.year, competition.hostCountries, competition.startDate, competition.endDate]
        );

        const [[competitionRow]] = await connection.query(
            'SELECT competition_id FROM competitions WHERE name = ? AND year = ?',
            [competition.name, competition.year]
        );

        const competitionId = competitionRow.competition_id;

        // Refresh only this competition's generated sport data. Other competitions stay untouched.
        await connection.query(
            `DELETE e FROM events e
             JOIN matches m ON e.match_id = m.match_id
             WHERE m.competition_id = ?`,
            [competitionId]
        );
        await connection.query(
            `DELETE mr FROM match_referees mr
             JOIN matches m ON mr.match_id = m.match_id
             WHERE m.competition_id = ?`,
            [competitionId]
        );
        await connection.query('DELETE FROM knockout_matches WHERE competition_id = ?', [competitionId]);
        await connection.query('DELETE FROM standings WHERE competition_id = ?', [competitionId]);
        await connection.query('DELETE FROM matches WHERE competition_id = ?', [competitionId]);
        await connection.query(
            `DELETE p FROM players p
             JOIN teams t ON p.team_id = t.team_id
             WHERE t.competition_id = ?`,
            [competitionId]
        );
        await connection.query('DELETE FROM teams WHERE competition_id = ?', [competitionId]);
        await connection.query('DELETE FROM groups_pool WHERE competition_id = ?', [competitionId]);

        const groupIds = new Map();
        for (const name of ['A','B','C','D','E','F','G','H','I','J','K','L']) {
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
                 ON DUPLICATE KEY UPDATE city = VALUES(city), country = VALUES(country), capacity = VALUES(capacity)`,
                [name, city, country, capacity]
            );
            const [[stadiumRow]] = await connection.query('SELECT stadium_id FROM stadiums WHERE name = ?', [name]);
            stadiumIds.set(name, stadiumRow.stadium_id);
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

        const teamIds = new Map();
        const playerIds = new Map();
        for (const team of teams) {
            await connection.query(
                `INSERT INTO teams (competition_id, group_id, name, fifa_code, iso_code, confederation, flag_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    competition_id = VALUES(competition_id),
                    group_id = VALUES(group_id),
                    name = VALUES(name),
                    iso_code = VALUES(iso_code),
                    confederation = VALUES(confederation),
                    flag_url = VALUES(flag_url)`,
                [competitionId, groupIds.get(team.group), team.name, team.code, team.iso.toUpperCase().slice(0, 2), team.confederation, flagUrl(team)]
            );
            const [[teamRow]] = await connection.query('SELECT team_id FROM teams WHERE fifa_code = ?', [team.code]);
            teamIds.set(team.name, teamRow.team_id);

            const players = playersByTeam[team.name];
            if (!players) {
                throw new Error(`Missing player list for ${team.name}`);
            }

            for (const [index, fullName] of players.entries()) {
                await connection.query(
                    `INSERT INTO players (team_id, full_name, position, shirt_number, club)
                     VALUES (?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), position = VALUES(position)`,
                    [teamRow.team_id, fullName, getPosition(index), index + 1, null]
                );
                const [[playerRow]] = await connection.query(
                    'SELECT player_id FROM players WHERE team_id = ? AND shirt_number = ?',
                    [teamRow.team_id, index + 1]
                );
                playerIds.set(`${team.name}-${index}`, playerRow.player_id);
            }
        }

        let matchNumber = 1;
        const seededEvents = [];

        // helper to format dates safely
        const formatDate = (d) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const hh = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            const ss = String(d.getSeconds()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
        };

        const groupBaseDate = new Date('2026-06-11T18:00:00');

        for (const group of Object.keys(groupFixtures)) {
            for (const [home, away, homeScore, awayScore] of groupFixtures[group]) {
                const groupId = groupIds.get(group);
                const stadium = stadiums[(matchNumber - 1) % stadiums.length][0];

                // compute a safe kickoff date by adding an offset from the base date
                const offsetDays = (matchNumber - 1) % 30; // keep within month bounds
                const kickoff = new Date(groupBaseDate);
                kickoff.setDate(groupBaseDate.getDate() + offsetDays);

                await connection.query(
                    `INSERT INTO matches (
                        competition_id, group_id, home_team_id, away_team_id,
                        stadium_id, match_number, stage, status, kickoff_at, home_score, away_score
                     ) VALUES (?, ?, ?, ?, ?, ?, 'group', 'finished', ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        home_team_id = VALUES(home_team_id), away_team_id = VALUES(away_team_id),
                        stadium_id = VALUES(stadium_id), stage = VALUES(stage), status = VALUES(status),
                        kickoff_at = VALUES(kickoff_at), home_score = VALUES(home_score), away_score = VALUES(away_score)`,
                    [
                        competitionId,
                        groupId,
                        teamIds.get(home),
                        teamIds.get(away),
                        stadiumIds.get(stadium),
                        matchNumber,
                        formatDate(kickoff),
                        homeScore,
                        awayScore,
                    ]
                );

                const [[matchRow]] = await connection.query(
                    'SELECT match_id FROM matches WHERE competition_id = ? AND match_number = ?',
                    [competitionId, matchNumber]
                );
                await connection.query(
                    `INSERT INTO match_referees (match_id, referee_id, role)
                     VALUES (?, ?, 'main')
                     ON DUPLICATE KEY UPDATE referee_id = VALUES(referee_id)`,
                    [matchRow.match_id, refereeIds[(matchNumber - 1) % refereeIds.length]]
                );
                seededEvents.push(...buildEventsForMatch(matchNumber, home, away, homeScore, awayScore));
                matchNumber += 1;
            }
        }

        const standings = new Map();
        for (const team of teams) {
            standings.set(team.name, {
                team_id: teamIds.get(team.name),
                group: team.group,
                matches_played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
                points: 0,
            });
        }

        for (const group of Object.keys(groupFixtures)) {
            for (const [home, away, homeScore, awayScore] of groupFixtures[group]) {
                const homeStats = standings.get(home);
                const awayStats = standings.get(away);
                homeStats.matches_played += 1;
                awayStats.matches_played += 1;
                homeStats.goals_for += homeScore;
                homeStats.goals_against += awayScore;
                awayStats.goals_for += awayScore;
                awayStats.goals_against += homeScore;

                if (homeScore > awayScore) {
                    homeStats.wins += 1;
                    awayStats.losses += 1;
                    homeStats.points += 3;
                } else if (homeScore < awayScore) {
                    awayStats.wins += 1;
                    homeStats.losses += 1;
                    awayStats.points += 3;
                } else {
                    homeStats.draws += 1;
                    awayStats.draws += 1;
                    homeStats.points += 1;
                    awayStats.points += 1;
                }
            }
        }

        for (const group of ['A','B','C','D','E','F','G','H','I','J','K','L']) {
            const groupTeams = teams.filter((team) => team.group === group).map((team) => standings.get(team.name));
            groupTeams.sort((a, b) => {
                const diffA = a.goals_for - a.goals_against;
                const diffB = b.goals_for - b.goals_against;
                if (a.points !== b.points) return b.points - a.points;
                if (diffA !== diffB) return diffB - diffA;
                return b.goals_for - a.goals_for;
            });

            for (let position = 0; position < groupTeams.length; position++) {
                const stats = groupTeams[position];
                const goalDifference = stats.goals_for - stats.goals_against;
                await connection.query(
                    `INSERT INTO standings (
                        competition_id, group_id, team_id, position,
                        matches_played, wins, draws, losses,
                        goals_for, goals_against, goal_difference, points
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE
                        position = VALUES(position), matches_played = VALUES(matches_played),
                        wins = VALUES(wins), draws = VALUES(draws), losses = VALUES(losses),
                        goals_for = VALUES(goals_for), goals_against = VALUES(goals_against),
                        goal_difference = VALUES(goal_difference), points = VALUES(points)`,
                    [
                        competitionId,
                        groupIds.get(group),
                        stats.team_id,
                        position + 1,
                        stats.matches_played,
                        stats.wins,
                        stats.draws,
                        stats.losses,
                        stats.goals_for,
                        stats.goals_against,
                        goalDifference,
                        stats.points,
                    ]
                );
            }
        }

        // knockout matches: start from July 1st 2026 at 20:00 and increment safely
        const knockoutBase = new Date('2026-07-01T20:00:00');
        for (const match of knockoutMatches) {
            const homeId = teamIds.get(match.home);
            const awayId = teamIds.get(match.away);
            const winnerName = match.winner || (match.home_score > match.away_score ? match.home : match.away);
            const winnerId = teamIds.get(winnerName);
            if (!homeId || !awayId) {
                throw new Error(`Unknown knockout team: ${match.home} vs ${match.away}`);
            }
            if (!winnerId) {
                throw new Error(`Unknown knockout winner: ${winnerName}`);
            }
            await connection.query(
                `INSERT INTO matches (
                    competition_id, home_team_id, away_team_id, stadium_id,
                    match_number, stage, status, kickoff_at, home_score, away_score
                 ) VALUES (?, ?, ?, ?, ?, ?, 'finished', ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    home_team_id = VALUES(home_team_id), away_team_id = VALUES(away_team_id),
                    stadium_id = VALUES(stadium_id), stage = VALUES(stage), status = VALUES(status),
                    kickoff_at = VALUES(kickoff_at), home_score = VALUES(home_score), away_score = VALUES(away_score)`,
                [
                    competitionId,
                    homeId,
                    awayId,
                    stadiumIds.get(stadiums[(matchNumber - 1) % stadiums.length][0]),
                    matchNumber,
                    match.stage,
                    // compute knockout kickoff by adding days from base
                    formatDate(new Date(knockoutBase.getTime() + (matchNumber - 25) * 24 * 60 * 60 * 1000)),
                    match.home_score,
                    match.away_score,
                ]
            );
            const [[result]] = await connection.query(
                'SELECT match_id FROM matches WHERE competition_id = ? AND match_number = ?',
                [competitionId, matchNumber]
            );
            await connection.query(
                `INSERT INTO match_referees (match_id, referee_id, role)
                 VALUES (?, ?, 'main')
                 ON DUPLICATE KEY UPDATE referee_id = VALUES(referee_id)`,
                [result.match_id, refereeIds[(matchNumber - 1) % refereeIds.length]]
            );
            await connection.query(
                `INSERT INTO knockout_matches (
                    competition_id, stage, position, home_team_id, away_team_id, match_id, winner_team_id
                 ) VALUES (?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                    home_team_id = VALUES(home_team_id), away_team_id = VALUES(away_team_id),
                    match_id = VALUES(match_id), winner_team_id = VALUES(winner_team_id)`,
                [
                    competitionId,
                    match.stage,
                    match.position,
                    homeId,
                    awayId,
                    result.match_id,
                    winnerId,
                ]
            );
            seededEvents.push(...buildEventsForMatch(matchNumber, match.home, match.away, match.home_score, match.away_score));
            matchNumber += 1;
        }

        for (const event of seededEvents) {
            const [[matchRow]] = await connection.query(
                'SELECT match_id FROM matches WHERE competition_id = ? AND match_number = ?',
                [competitionId, event.matchNumber]
            );
            if (!matchRow) continue;
            const teamId = teamIds.get(event.team);
            const playerId = playerIds.get(`${event.team}-${event.playerIndex}`);
            if (!teamId || !playerId) continue;
            await connection.query(
                `INSERT INTO events (match_id, team_id, player_id, minute, event_type, description)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    matchRow.match_id,
                    teamId,
                    playerId,
                    event.minute,
                    event.event_type,
                    event.description,
                ]
            );
        }

        await connection.commit();
        console.log('Seed Personne 3 completed successfully');
        console.log(`Competition ${competition.name} seeded with ${teams.length} teams and ${matchNumber - 1} matches`);
    } catch (error) {
        await connection.rollback();
        console.error('Error seeding Personne 3:', error.message);
        process.exitCode = 1;
    } finally {
        await connection.end();
    }
}

seed();
