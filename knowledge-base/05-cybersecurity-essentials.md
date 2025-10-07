# Cybersecurity Essentials

## Introduction to Cybersecurity

Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks. These cyberattacks are usually aimed at accessing, changing, or destroying sensitive information; extorting money from users; or interrupting normal business processes.

## Core Security Principles (CIA Triad)

### Confidentiality
- **Definition**: Ensuring information is accessible only to authorized individuals
- **Methods**: Encryption, access controls, authentication
- **Examples**: Password protection, data classification, need-to-know basis
- **Violations**: Data breaches, unauthorized access, espionage

### Integrity
- **Definition**: Maintaining accuracy and completeness of data
- **Methods**: Digital signatures, checksums, version control
- **Examples**: File integrity monitoring, database constraints
- **Violations**: Data tampering, unauthorized modifications, corruption

### Availability
- **Definition**: Ensuring information and systems are accessible when needed
- **Methods**: Redundancy, backup systems, disaster recovery
- **Examples**: Load balancing, failover systems, DDoS protection
- **Violations**: System outages, denial of service attacks, hardware failures

## Common Cyber Threats

### Malware
1. **Viruses**: Self-replicating programs that attach to other files
2. **Worms**: Self-replicating programs that spread across networks
3. **Trojans**: Malicious programs disguised as legitimate software
4. **Ransomware**: Encrypts data and demands payment for decryption
5. **Spyware**: Secretly monitors and collects user information
6. **Adware**: Displays unwanted advertisements

### Social Engineering
- **Phishing**: Fraudulent emails to steal sensitive information
- **Spear Phishing**: Targeted phishing attacks
- **Whaling**: Phishing attacks targeting high-profile individuals
- **Pretexting**: Creating false scenarios to obtain information
- **Baiting**: Offering something enticing to spark curiosity
- **Tailgating**: Following authorized personnel into secure areas

### Network Attacks
- **Man-in-the-Middle**: Intercepting communication between parties
- **DDoS**: Overwhelming systems with traffic to cause outages
- **SQL Injection**: Exploiting database vulnerabilities
- **Cross-Site Scripting (XSS)**: Injecting malicious scripts into websites
- **DNS Spoofing**: Redirecting domain name queries to malicious sites

### Advanced Persistent Threats (APTs)
- **Characteristics**: Long-term, stealthy, targeted attacks
- **Stages**: Initial compromise, establishment, lateral movement, data exfiltration
- **Actors**: Nation-states, organized crime groups, corporate espionage
- **Defense**: Continuous monitoring, threat intelligence, incident response

## Security Controls and Frameworks

### Administrative Controls
- **Security Policies**: Written rules and procedures
- **Training and Awareness**: Employee education programs
- **Access Management**: User provisioning and deprovisioning
- **Incident Response**: Procedures for handling security events
- **Risk Assessment**: Identifying and evaluating threats

### Technical Controls
- **Firewalls**: Network traffic filtering and control
- **Intrusion Detection Systems (IDS)**: Monitor for malicious activity
- **Intrusion Prevention Systems (IPS)**: Block detected threats
- **Antivirus/Anti-malware**: Detect and remove malicious software
- **Encryption**: Protect data confidentiality and integrity
- **Multi-Factor Authentication (MFA)**: Additional verification layers

### Physical Controls
- **Access Cards**: Control physical entry to facilities
- **Biometric Systems**: Fingerprint, facial recognition authentication
- **Security Cameras**: Monitor and record activities
- **Environmental Controls**: Temperature, humidity, fire suppression
- **Cable Locks**: Secure equipment to prevent theft

### Popular Security Frameworks
1. **NIST Cybersecurity Framework**
   - Functions: Identify, Protect, Detect, Respond, Recover
   - Industry-agnostic, voluntary guidance

2. **ISO 27001**
   - International standard for information security management
   - Certification-based, comprehensive controls

3. **COBIT**
   - Governance and management framework for IT
   - Business-focused, risk-based approach

4. **CIS Controls**
   - 20 critical security controls
   - Prioritized, implementation-focused

## Identity and Access Management (IAM)

### Authentication Factors
1. **Something you know**: Passwords, PINs, security questions
2. **Something you have**: Smart cards, tokens, mobile devices
3. **Something you are**: Biometrics (fingerprints, iris, voice)
4. **Somewhere you are**: Location-based authentication
5. **Something you do**: Behavioral patterns, keystroke dynamics

### Access Control Models
- **Discretionary Access Control (DAC)**: Resource owners control access
- **Mandatory Access Control (MAC)**: System enforces access based on classifications
- **Role-Based Access Control (RBAC)**: Access based on user roles
- **Attribute-Based Access Control (ABAC)**: Access based on attributes and policies

### Privileged Access Management (PAM)
- **Purpose**: Secure, control, and monitor privileged accounts
- **Features**: Password vaulting, session recording, just-in-time access
- **Benefits**: Reduce insider threats, compliance, audit trails

## Network Security

### Perimeter Security
- **Firewalls**: Stateful packet inspection, application-layer filtering
- **DMZ**: Demilitarized zone for public-facing services
- **VPN**: Secure remote access and site-to-site connectivity
- **Web Application Firewalls (WAF)**: Protect web applications

### Network Segmentation
- **VLANs**: Logical separation of network traffic
- **Subnetting**: Divide networks into smaller segments
- **Zero Trust**: Never trust, always verify approach
- **Micro-segmentation**: Granular network isolation

### Wireless Security
- **WPA3**: Latest Wi-Fi security protocol
- **Enterprise Authentication**: 802.1X with RADIUS
- **Guest Networks**: Isolated access for visitors
- **Rogue Access Point Detection**: Identify unauthorized wireless devices

## Incident Response and Business Continuity

### Incident Response Process
1. **Preparation**: Plans, procedures, tools, and training
2. **Identification**: Detect and analyze potential incidents
3. **Containment**: Limit damage and prevent spread
4. **Eradication**: Remove threat from environment
5. **Recovery**: Restore systems and services
6. **Lessons Learned**: Post-incident review and improvement

### Computer Security Incident Response Team (CSIRT)
- **Roles**: Incident manager, analysts, communications, legal
- **Responsibilities**: Response coordination, technical analysis, communication
- **Skills**: Technical expertise, communication, decision-making

### Business Continuity Planning (BCP)
- **Business Impact Analysis**: Identify critical processes and dependencies
- **Recovery Time Objective (RTO)**: Maximum acceptable downtime
- **Recovery Point Objective (RPO)**: Maximum acceptable data loss
- **Disaster Recovery**: IT-focused recovery procedures

### Backup and Recovery
- **Backup Types**: Full, incremental, differential
- **Storage Locations**: On-site, off-site, cloud
- **Testing**: Regular restoration tests to verify integrity
- **Retention**: Legal and business requirements for data retention

## Compliance and Legal Considerations

### Major Regulations
1. **GDPR**: General Data Protection Regulation (EU)
   - Personal data protection and privacy
   - Rights of data subjects, breach notification

2. **HIPAA**: Health Insurance Portability and Accountability Act (US)
   - Protected health information (PHI)
   - Administrative, physical, and technical safeguards

3. **PCI DSS**: Payment Card Industry Data Security Standard
   - Credit card data protection
   - Network security, access controls, monitoring

4. **SOX**: Sarbanes-Oxley Act (US)
   - Financial reporting accuracy
   - Internal controls, auditing requirements

### Privacy Considerations
- **Data Minimization**: Collect only necessary information
- **Purpose Limitation**: Use data only for stated purposes
- **Retention Limits**: Delete data when no longer needed
- **User Rights**: Access, correction, deletion, portability

## Emerging Security Challenges

### Cloud Security
- **Shared Responsibility Model**: Provider vs. customer responsibilities
- **Configuration Management**: Secure cloud service settings
- **Data Location**: Geographic and regulatory considerations
- **Multi-tenancy**: Isolation in shared environments

### IoT Security
- **Device Management**: Inventory, configuration, updates
- **Authentication**: Device identity and credentials
- **Communication Security**: Encrypted data transmission
- **Lifecycle Management**: Secure deployment to decommission

### AI and Machine Learning Security
- **Model Poisoning**: Corrupting training data
- **Adversarial Attacks**: Deceiving AI systems
- **Data Privacy**: Protecting sensitive training data
- **Explainability**: Understanding AI decision-making

### DevSecOps
- **Shift Left**: Integrate security early in development
- **Automation**: Security testing and deployment
- **Continuous Monitoring**: Real-time security assessment
- **Collaboration**: Development, security, and operations teams