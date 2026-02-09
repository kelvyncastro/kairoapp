import { Link } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        </div>

        <p className="text-muted-foreground text-sm mb-10">Última atualização: 09 de fevereiro de 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Introdução</h2>
            <p>A Kairo ("nós", "nosso" ou "plataforma") valoriza a privacidade dos seus usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais ao utilizar nossos serviços.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Dados que Coletamos</h2>
            <p className="mb-2">Podemos coletar os seguintes tipos de informações:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-foreground">Dados de cadastro:</strong> nome, e-mail, data de nascimento e telefone (opcional).</li>
              <li><strong className="text-foreground">Dados de uso:</strong> tarefas, hábitos, metas, registros financeiros, dados de treino e dieta inseridos por você na plataforma.</li>
              <li><strong className="text-foreground">Dados técnicos:</strong> endereço IP, tipo de navegador, dispositivo e dados de acesso para fins de segurança e melhoria do serviço.</li>
              <li><strong className="text-foreground">Dados de pagamento:</strong> processados por terceiros (gateways de pagamento). Não armazenamos dados de cartão de crédito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Como Usamos seus Dados</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Fornecer, manter e melhorar os serviços da plataforma.</li>
              <li>Personalizar sua experiência e exibir conteúdo relevante.</li>
              <li>Enviar comunicações importantes sobre sua conta ou atualizações do serviço.</li>
              <li>Gerar análises agregadas e anônimas para melhoria do produto.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Compartilhamento de Dados</h2>
            <p>Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing. Seus dados podem ser compartilhados apenas:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>Com prestadores de serviço essenciais para o funcionamento da plataforma (hospedagem, processamento de pagamentos).</li>
              <li>Quando exigido por lei, ordem judicial ou autoridade governamental competente.</li>
              <li>Com seu consentimento explícito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Armazenamento e Segurança</h2>
            <p>Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS/SSL) e em repouso. Implementamos medidas técnicas e organizacionais adequadas para proteger suas informações contra acesso não autorizado, perda ou destruição.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Seus Direitos</h2>
            <p className="mb-2">De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Acessar seus dados pessoais armazenados por nós.</li>
              <li>Solicitar a correção de dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusão dos seus dados pessoais.</li>
              <li>Revogar o consentimento para o tratamento de dados a qualquer momento.</li>
              <li>Solicitar a portabilidade dos seus dados.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Cookies</h2>
            <p>Utilizamos cookies essenciais para o funcionamento da plataforma, como autenticação e preferências de sessão. Não utilizamos cookies de rastreamento para publicidade de terceiros.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Retenção de Dados</h2>
            <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, seus dados serão removidos em até 30 dias, exceto quando houver obrigação legal de retenção.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Alterações nesta Política</h2>
            <p>Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas por e-mail ou através da plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Contato</h2>
            <p>Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato conosco pelo e-mail: <strong className="text-foreground">contato@kairoapp.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
