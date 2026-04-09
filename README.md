#SISTEMA DISTRIBUÍDO DE
DETECÇÃO E CLASSIFICAÇÃO SONORA PARA ACESSIBILIDADE DOMÉSTICA

O presente projeto propõe o desenvolvimento
de um sistema de Internet das Coisas (IoT) distribuído e de baixo custo (RAY,
2018), focado na captação, classificação e notificação de eventos sonoros
residenciais, como choro de bebé, alarmes de incêndio, campainhas e quebra de
vidro.
Diferente de soluções comerciais de alto custo, este projeto adota uma arquitetura
computacional híbrida (Nuvem e Borda) e modular. A integração da Computação
de Borda (Edge Computing) é essencial para mitigar a latência e a dependência
exclusiva de conectividade externa em sistemas críticos (SHI et al., 2016). Aliada
a esta arquitetura, a adoção do paradigma TinyML viabiliza a execução de
modelos avançados de classificação de áudio (HERSHEY et al., 2017)
diretamente em microcontroladores de baixo consumo de energia (WARDEN;
SITUNAYAKE, 2019). Esta abordagem permite a escalabilidade do monitoramento
para múltiplos compartimentos com alta precisão e processamento em tempo real.