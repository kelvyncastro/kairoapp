import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">Termos de Serviço</h1>
        </div>

        <p className="text-muted-foreground text-sm mb-10">Última atualização: 09 de fevereiro de 2026</p>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Aceitação dos Termos</h2>
            <p>Ao acessar ou utilizar a plataforma Kairo ("Serviço"), você concorda com estes Termos de Serviço. Se você não concordar com qualquer parte destes termos, não utilize o Serviço.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Descrição do Serviço</h2>
            <p>A Kairo é uma plataforma de produtividade e organização pessoal que oferece ferramentas para gerenciamento de tarefas, hábitos, metas, finanças pessoais, calendário, treinos e dieta. O Serviço é disponibilizado em modalidades gratuita e paga (assinatura).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Cadastro e Conta</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Você deve fornecer informações verdadeiras e atualizadas ao se cadastrar.</li>
              <li>Você é responsável por manter a confidencialidade de suas credenciais de acesso.</li>
              <li>Você é responsável por todas as atividades realizadas em sua conta.</li>
              <li>Você deve ter pelo menos 16 anos de idade para utilizar o Serviço.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Planos e Pagamentos</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Os planos pagos são cobrados de forma recorrente (mensal ou anual) conforme o plano escolhido.</li>
              <li>O cancelamento pode ser realizado a qualquer momento. O acesso ao plano pago permanece até o fim do período já pago.</li>
              <li>Não oferecemos reembolso para períodos parciais de assinatura, exceto quando exigido por lei.</li>
              <li>Os preços podem ser alterados com aviso prévio de 30 dias.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Uso Aceitável</h2>
            <p className="mb-2">Ao utilizar o Serviço, você concorda em não:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Violar leis ou regulamentos aplicáveis.</li>
              <li>Tentar acessar contas de outros usuários sem autorização.</li>
              <li>Utilizar o Serviço para atividades ilegais ou fraudulentas.</li>
              <li>Interferir no funcionamento da plataforma ou seus servidores.</li>
              <li>Reproduzir, copiar ou revender o Serviço sem autorização prévia.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Propriedade Intelectual</h2>
            <p>Todo o conteúdo da plataforma (design, código, textos, logotipos e marcas) é de propriedade da Kairo ou de seus licenciadores. Você mantém a propriedade dos dados que insere na plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Disponibilidade do Serviço</h2>
            <p>Nos esforçamos para manter o Serviço disponível 24 horas por dia, 7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta. Manutenções programadas serão comunicadas com antecedência quando possível.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Limitação de Responsabilidade</h2>
            <p>A Kairo não se responsabiliza por danos indiretos, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso do Serviço. O Serviço é fornecido "como está" e "conforme disponível".</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Encerramento de Conta</h2>
            <p>Podemos suspender ou encerrar sua conta caso haja violação destes termos. Você pode solicitar a exclusão da sua conta a qualquer momento através das configurações da plataforma ou por e-mail.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Alterações nos Termos</h2>
            <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma com pelo menos 15 dias de antecedência.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Lei Aplicável</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão resolvidas no foro da comarca do domicílio do usuário, conforme previsto no Código de Defesa do Consumidor.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Contato</h2>
            <p>Para dúvidas sobre estes Termos, entre em contato pelo e-mail: <strong className="text-foreground">contato@kairoapp.com</strong></p>
          </section>
        </div>
      </div>
    </div>
  );
}
