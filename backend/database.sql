CREATE TABLE IF NOT EXISTS users (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url    VARCHAR(255) DEFAULT NULL,
    role          ENUM('user', 'moderator', 'admin', 'super_admin') DEFAULT 'user',
    is_active     TINYINT(1)   DEFAULT 1,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    last_login    TIMESTAMP    DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS competitions (
    competition_id INT AUTO_INCREMENT PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    year           INT          NOT NULL,
    host_countries VARCHAR(120) NOT NULL,
    start_date     DATE         NOT NULL,
    end_date       DATE         NOT NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_competition_year (name, year)
);

CREATE TABLE IF NOT EXISTS groups_pool (
    group_id       INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT     NOT NULL,
    name           CHAR(1) NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_group_competition (competition_id, name),
    CONSTRAINT fk_groups_competition
        FOREIGN KEY (competition_id) REFERENCES competitions(competition_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teams (
    team_id        INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT          NOT NULL,
    group_id       INT          DEFAULT NULL,
    name           VARCHAR(100) NOT NULL,
    fifa_code      CHAR(3)      NOT NULL UNIQUE,
    iso_code       CHAR(2)      NOT NULL,
    confederation  VARCHAR(20)  DEFAULT NULL,
    coach          VARCHAR(100) DEFAULT NULL,
    flag_url       VARCHAR(255) DEFAULT NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_teams_group (group_id),
    CONSTRAINT fk_teams_competition
        FOREIGN KEY (competition_id) REFERENCES competitions(competition_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_teams_group
        FOREIGN KEY (group_id) REFERENCES groups_pool(group_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS players (
    player_id     INT AUTO_INCREMENT PRIMARY KEY,
    team_id       INT NOT NULL,
    full_name     VARCHAR(120) NOT NULL,
    position      ENUM('goalkeeper', 'defender', 'midfielder', 'forward') NOT NULL,
    shirt_number  INT DEFAULT NULL,
    club          VARCHAR(120) DEFAULT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_player_number_team (team_id, shirt_number),
    INDEX idx_players_team (team_id),
    CONSTRAINT fk_players_team
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stadiums (
    stadium_id INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(120) NOT NULL UNIQUE,
    city       VARCHAR(100) NOT NULL,
    country    VARCHAR(80)  NOT NULL,
    capacity   INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    match_id       INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    group_id       INT DEFAULT NULL,
    home_team_id   INT NOT NULL,
    away_team_id   INT NOT NULL,
    stadium_id     INT DEFAULT NULL,
    match_number   INT NOT NULL UNIQUE,
    stage          ENUM('group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final') DEFAULT 'group',
    status         ENUM('scheduled', 'live', 'finished', 'postponed') DEFAULT 'scheduled',
    kickoff_at     DATETIME NOT NULL,
    home_score     INT DEFAULT NULL,
    away_score     INT DEFAULT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_matches_date (kickoff_at),
    INDEX idx_matches_status (status),
    INDEX idx_matches_stage (stage),
    INDEX idx_matches_home_team (home_team_id),
    INDEX idx_matches_away_team (away_team_id),
    CONSTRAINT fk_matches_competition
        FOREIGN KEY (competition_id) REFERENCES competitions(competition_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_matches_group
        FOREIGN KEY (group_id) REFERENCES groups_pool(group_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_matches_home_team
        FOREIGN KEY (home_team_id) REFERENCES teams(team_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_matches_away_team
        FOREIGN KEY (away_team_id) REFERENCES teams(team_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_matches_stadium
        FOREIGN KEY (stadium_id) REFERENCES stadiums(stadium_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS events (
    event_id    INT AUTO_INCREMENT PRIMARY KEY,
    match_id    INT NOT NULL,
    team_id     INT NOT NULL,
    player_id   INT DEFAULT NULL,
    minute      INT NOT NULL,
    event_type  ENUM('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'penalty') NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_events_match (match_id),
    INDEX idx_events_type (event_type),
    CONSTRAINT fk_events_match
        FOREIGN KEY (match_id) REFERENCES matches(match_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_events_team
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_events_player
        FOREIGN KEY (player_id) REFERENCES players(player_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS referees (
    referee_id  INT AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL UNIQUE,
    nationality VARCHAR(80) DEFAULT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_referees (
    match_id   INT NOT NULL,
    referee_id INT NOT NULL,
    role       ENUM('main', 'assistant', 'var', 'fourth') DEFAULT 'main',
    PRIMARY KEY (match_id, referee_id, role),
    CONSTRAINT fk_match_referees_match
        FOREIGN KEY (match_id) REFERENCES matches(match_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_match_referees_referee
        FOREIGN KEY (referee_id) REFERENCES referees(referee_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS standings (
    standing_id     INT AUTO_INCREMENT PRIMARY KEY,
    competition_id  INT NOT NULL,
    group_id        INT NOT NULL,
    team_id         INT NOT NULL,
    position        INT NOT NULL,
    matches_played  INT DEFAULT 0,
    wins            INT DEFAULT 0,
    draws           INT DEFAULT 0,
    losses          INT DEFAULT 0,
    goals_for       INT DEFAULT 0,
    goals_against   INT DEFAULT 0,
    goal_difference INT DEFAULT 0,
    points          INT DEFAULT 0,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_standing_group_team (group_id, team_id),
    INDEX idx_standings_group (group_id),
    INDEX idx_standings_competition (competition_id),
    CONSTRAINT fk_standings_competition
        FOREIGN KEY (competition_id) REFERENCES competitions(competition_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_standings_group
        FOREIGN KEY (group_id) REFERENCES groups_pool(group_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_standings_team
        FOREIGN KEY (team_id) REFERENCES teams(team_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS knockout_matches (
    knockout_id     INT AUTO_INCREMENT PRIMARY KEY,
    competition_id  INT NOT NULL,
    stage           ENUM('round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final') NOT NULL,
    position        INT NOT NULL,
    home_team_id    INT DEFAULT NULL,
    away_team_id    INT DEFAULT NULL,
    match_id        INT DEFAULT NULL,
    winner_team_id  INT DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_knockout_position (competition_id, stage, position),
    INDEX idx_knockout_stage (stage),
    INDEX idx_knockout_competition (competition_id),
    CONSTRAINT fk_knockout_competition
        FOREIGN KEY (competition_id) REFERENCES competitions(competition_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_knockout_home_team
        FOREIGN KEY (home_team_id) REFERENCES teams(team_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_knockout_away_team
        FOREIGN KEY (away_team_id) REFERENCES teams(team_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_knockout_match
        FOREIGN KEY (match_id) REFERENCES matches(match_id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS news (
    news_id      INT AUTO_INCREMENT PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    content      TEXT         NOT NULL,
    image_url    VARCHAR(255) DEFAULT NULL,
    author_id    INT          NOT NULL,
    published_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_author
        FOREIGN KEY (author_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leagues (
    league_id   INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    owner_id    INT          NOT NULL,
    invite_code VARCHAR(20)  NOT NULL UNIQUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leagues_owner
        FOREIGN KEY (owner_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS league_members (
    league_id INT NOT NULL,
    user_id   INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (league_id, user_id),
    CONSTRAINT fk_league_members_league
        FOREIGN KEY (league_id) REFERENCES leagues(league_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_league_members_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS predictions (
    prediction_id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id               INT NOT NULL,
    match_id              INT NOT NULL,
    predicted_home_score  INT NOT NULL,
    predicted_away_score  INT NOT NULL,
    points_earned         INT DEFAULT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_match (user_id, match_id),
    CONSTRAINT fk_predictions_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_predictions_match
        FOREIGN KEY (match_id) REFERENCES matches(match_id)
        ON DELETE CASCADE
);
