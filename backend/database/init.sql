CREATE TABLE event (
                       id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                       slug       VARCHAR(200) NOT NULL UNIQUE,
                       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       ended_at   DATETIME NULL
);

CREATE TABLE customer (
                          id                SERIAL PRIMARY KEY,
                          event_id          INT UNSIGNED NOT NULL REFERENCES event(id) ON DELETE CASCADE,
                          name              VARCHAR(255) NOT NULL,
                          email             VARCHAR(255) NOT NULL,
                          accept_recontact  BOOLEAN NOT NULL DEFAULT FALSE,
                          accept_newsletter BOOLEAN NOT NULL DEFAULT FALSE,
                          user_agent        TEXT NOT NULL,
                          smartphone_model  VARCHAR(255) NOT NULL,
                          date_fabrication  DATE NOT NULL,
                          image_path        VARCHAR(512),
                          classement        INTEGER,
                          created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
                          updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);


alter table customer
    add os_version varchar(100) null after date_fabrication;


alter table customer
    change classement rank int null;

alter table customer
    modify smartphone_model varchar(255) null;

alter table customer
    modify date_fabrication date null;

