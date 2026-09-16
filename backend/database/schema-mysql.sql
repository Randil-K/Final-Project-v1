
    create table account_documents (
        id bigint not null auto_increment,
        size_bytes bigint not null,
        uploaded_at datetime(6) not null,
        user_id bigint not null,
        original_name varchar(150) not null,
        content_type varchar(255) not null,
        stored_name varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table alerts (
        critical boolean default false not null,
        radius_km float(53),
        read_flag bit not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        project_id bigint,
        recipient_id bigint not null,
        report_id bigint,
        body varchar(1000) not null,
        title varchar(255) not null,
        type varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table cleanup_projects (
        completion_percentage integer not null,
        debris_removed_kg float(53),
        divers_needed integer,
        latitude float(53),
        longitude float(53),
        volunteers_needed integer,
        completed_at datetime(6),
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        owner_id bigint not null,
        report_id bigint,
        resources_finalized_at datetime(6),
        resources_finalized_by_id bigint,
        started_at datetime(6),
        description varchar(2000),
        location_name varchar(255) not null,
        province varchar(255),
        reference varchar(255) not null,
        status varchar(255) not null,
        title varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table comment_reactions (
        comment_id bigint not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        user_id bigint not null,
        type varchar(20) not null,
        primary key (id)
    ) engine=InnoDB;

    create table diver_preferred_regions (
        diver_profile_id bigint not null,
        region varchar(255)
    ) engine=InnoDB;

    create table diver_profiles (
        completed_projects integer not null,
        experience_years integer,
        id bigint not null auto_increment,
        user_id bigint not null,
        equipment varchar(500),
        certification_level varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table info_attachments (
        id bigint not null auto_increment,
        request_id bigint not null,
        size_bytes bigint not null,
        stored_name varchar(80) not null,
        content_type varchar(100) not null,
        original_name varchar(150) not null,
        primary key (id)
    ) engine=InnoDB;

    create table info_requests (
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        report_id bigint not null,
        requested_by_id bigint not null,
        responded_at datetime(6),
        status varchar(20) not null,
        message varchar(1000) not null,
        response_text varchar(2000),
        primary key (id)
    ) engine=InnoDB;

    create table opportunities (
        open bit not null,
        paid bit not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        organization_id bigint not null,
        description varchar(2000) not null,
        region varchar(255) not null,
        required_certification varchar(255),
        title varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table opportunity_applications (
        created_at datetime(6) not null,
        diver_id bigint not null,
        id bigint not null auto_increment,
        opportunity_id bigint not null,
        message varchar(1000),
        status varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table password_reset_tokens (
        created_at datetime(6) not null,
        expires_at datetime(6) not null,
        id bigint not null auto_increment,
        used_at datetime(6),
        user_id bigint not null,
        token_hash varchar(64) not null,
        primary key (id)
    ) engine=InnoDB;

    create table pollution_reports (
        alert_radius_km float(53) not null,
        confirm_votes integer not null,
        dispute_votes integer not null,
        latitude float(53) not null,
        longitude float(53) not null,
        trust_percentage integer not null,
        admin_reviewed_at datetime(6),
        authority_officer_id bigint,
        created_at datetime(6) not null,
        decided_at datetime(6),
        escalated_at datetime(6),
        id bigint not null auto_increment,
        reporter_id bigint not null,
        updated_at datetime(6),
        verified_at datetime(6),
        authority_comment varchar(1000),
        moderation_comment varchar(1000),
        description varchar(2000) not null,
        admin_decision varchar(255) not null,
        authority_decision varchar(255),
        location_name varchar(255) not null,
        province varchar(255),
        reference varchar(255) not null,
        severity varchar(255) not null,
        status varchar(255) not null,
        title varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table project_equipment (
        position integer not null,
        quantity integer not null,
        project_id bigint not null,
        name varchar(100) not null,
        primary key (position, project_id)
    ) engine=InnoDB;

    create table project_participants (
        contribution_mark integer,
        id bigint not null auto_increment,
        joined_at datetime(6) not null,
        project_id bigint not null,
        user_id bigint not null,
        participant_role varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table project_updates (
        completion_percentage integer,
        author_id bigint,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        project_id bigint not null,
        image_url varchar(1000),
        note varchar(1000) not null,
        stage varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table report_comments (
        official bit not null,
        author_id bigint not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        parent_id bigint,
        report_id bigint not null,
        body varchar(1000) not null,
        primary key (id)
    ) engine=InnoDB;

    create table report_photos (
        id bigint not null auto_increment,
        report_id bigint not null,
        stored_name varchar(80),
        content_type varchar(100),
        url varchar(1000) not null,
        caption varchar(255),
        primary key (id)
    ) engine=InnoDB;

    create table users (
        available_for_alerts bit not null,
        latitude float(53),
        longitude float(53),
        suspended bit not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        avatar_stored_name varchar(80),
        website_url varchar(300),
        account_review_note varchar(500),
        suspension_reason varchar(500),
        account_status varchar(255) not null,
        city varchar(255),
        email varchar(255) not null,
        full_name varchar(255) not null,
        organization_name varchar(255),
        organization_type varchar(255),
        password_hash varchar(255) not null,
        phone varchar(255),
        province varchar(255),
        role varchar(255) not null,
        primary key (id)
    ) engine=InnoDB;

    create table verification_votes (
        confirmed bit not null,
        created_at datetime(6) not null,
        id bigint not null auto_increment,
        report_id bigint not null,
        voter_id bigint not null,
        primary key (id)
    ) engine=InnoDB;

    alter table account_documents 
       add constraint UKs376h693q3xigdi0qbjhwpnby unique (stored_name);

    alter table cleanup_projects 
       add constraint UKeirb9dvc078wsq7xnelh5xgy6 unique (reference);

    alter table comment_reactions 
       add constraint UKjeq4skdrf5vch9lr8bwpupubj unique (comment_id, user_id);

    alter table diver_profiles 
       add constraint UKs31m3e52fy6r8h9gd9u62588i unique (user_id);

    alter table info_attachments 
       add constraint UKlo4y1fmuayl0fuh310foi6yh7 unique (stored_name);

    alter table opportunity_applications 
       add constraint UK5b42oiq067u9qtqfbovsu7kpp unique (opportunity_id, diver_id);

    alter table password_reset_tokens 
       add constraint UKajre85ybxavf1tt4omkrs5p6g unique (token_hash);

    alter table pollution_reports 
       add constraint UKegst8jtsmoh2g1oft8q54tpyk unique (reference);

    alter table project_participants 
       add constraint UKnfn4xoa7vx8t5bp16scgfwawh unique (project_id, user_id);

    alter table report_photos 
       add constraint UK6iut7wlrvo8a4yk4wyo7aoiix unique (stored_name);

    alter table users 
       add constraint UK6dotkott2kjsp8vw4d0m25fb7 unique (email);

    alter table verification_votes 
       add constraint UK6o1333hr5g3lmqpubj4ksiloa unique (report_id, voter_id);

    alter table account_documents 
       add constraint FKe6sj2xoswxmu9s3xq4bcwftu5 
       foreign key (user_id) 
       references users (id);

    alter table alerts 
       add constraint FK419j42c8tkd9ja320j2ah62eo 
       foreign key (recipient_id) 
       references users (id);

    alter table cleanup_projects 
       add constraint FKa3jvmn2jo0dfc69fdd3kubvra 
       foreign key (owner_id) 
       references users (id);

    alter table cleanup_projects 
       add constraint FKked56xoc81ct4pcxhb332p43r 
       foreign key (report_id) 
       references pollution_reports (id);

    alter table cleanup_projects 
       add constraint FKcigg8frt8ed1uv52mqg0f45em 
       foreign key (resources_finalized_by_id) 
       references users (id);

    alter table comment_reactions 
       add constraint FKbf6904sdbxretk0gv6p954lnx 
       foreign key (comment_id) 
       references report_comments (id);

    alter table comment_reactions 
       add constraint FK2t2mv78fm49m4lni9gih7kkaa 
       foreign key (user_id) 
       references users (id);

    alter table diver_preferred_regions 
       add constraint FKgbjoox80o4yvw8k1e0ud0bnhm 
       foreign key (diver_profile_id) 
       references diver_profiles (id);

    alter table diver_profiles 
       add constraint FKsajuy4v928jkxmquw8seuwjsr 
       foreign key (user_id) 
       references users (id);

    alter table info_attachments 
       add constraint FKmpgep34401dpe9nxr6eup2287 
       foreign key (request_id) 
       references info_requests (id);

    alter table info_requests 
       add constraint FKisjfwqpvhmameoscx8q53bhuj 
       foreign key (report_id) 
       references pollution_reports (id);

    alter table info_requests 
       add constraint FKjl14hb5e3agy64pae7ev2etay 
       foreign key (requested_by_id) 
       references users (id);

    alter table opportunities 
       add constraint FKsq6v38rwf9c8jir5ajh165cik 
       foreign key (organization_id) 
       references users (id);

    alter table opportunity_applications 
       add constraint FK4x1ky0kc5oxdj1m4kt8iwvt14 
       foreign key (diver_id) 
       references users (id);

    alter table opportunity_applications 
       add constraint FKh0rv8b1trflhtx6ojaejwbx0b 
       foreign key (opportunity_id) 
       references opportunities (id);

    alter table password_reset_tokens 
       add constraint FKk3ndxg5xp6v7wd4gjyusp15gq 
       foreign key (user_id) 
       references users (id);

    alter table pollution_reports 
       add constraint FK6fnsk3rr32u7e50187ifffbhk 
       foreign key (authority_officer_id) 
       references users (id);

    alter table pollution_reports 
       add constraint FKpb2fymox1xe1fa4mv9svv28xb 
       foreign key (reporter_id) 
       references users (id);

    alter table project_equipment 
       add constraint FK487aopc62km0ensxjjwsh2u13 
       foreign key (project_id) 
       references cleanup_projects (id);

    alter table project_participants 
       add constraint FKji16xp3imgmii7erky2pw02fy 
       foreign key (project_id) 
       references cleanup_projects (id);

    alter table project_participants 
       add constraint FKso729fy6p33s1cewrd5qw8u2v 
       foreign key (user_id) 
       references users (id);

    alter table project_updates 
       add constraint FKd4pa7lu4xunndqtalc27egr7e 
       foreign key (author_id) 
       references users (id);

    alter table project_updates 
       add constraint FK5wvwodpm0xv1eeonpwcbkudc5 
       foreign key (project_id) 
       references cleanup_projects (id);

    alter table report_comments 
       add constraint FKi8p0d6l24jm0hokvim8wspptq 
       foreign key (author_id) 
       references users (id);

    alter table report_comments 
       add constraint FKm9ckkf0napryt0kh8k5b0rp59 
       foreign key (parent_id) 
       references report_comments (id);

    alter table report_comments 
       add constraint FK1sbfe31jw54dkvitrbryuiq5b 
       foreign key (report_id) 
       references pollution_reports (id);

    alter table report_photos 
       add constraint FKpqcn5oj5abmp6smgd3wek127f 
       foreign key (report_id) 
       references pollution_reports (id);

    alter table verification_votes 
       add constraint FK24pg5tjkci3uncdcp6s106s28 
       foreign key (report_id) 
       references pollution_reports (id);

    alter table verification_votes 
       add constraint FKtnq8j38y7nw6g8pfd5vwk5qp4 
       foreign key (voter_id) 
       references users (id);
